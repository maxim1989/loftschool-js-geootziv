import store from './store.js';
import {openForm, addComment, closeForm, addNewMarker} from './form.js';

document.addEventListener("DOMContentLoaded", ready);

let myMap = null,
    flags = {
        myClusterer: null,
        activeSinglMark: null, // object, если был клик по маркеру с одним отзывом и открылась форма.
        isInfoWindowOpened: null // object, если был клик по карте и открылась форма.
    }; 

/**
 * Загрузка страницы.
 */
function ready() {
    const wrapper = document.querySelector('.Wrapper');

    wrapper.addEventListener('click', onWrapperClick);

    ymaps.ready(initMap);
}

/**
 * Инициализация карты.
 */
function initMap() {
    myMap = new ymaps.Map("map", {
        center: [55.760458, 37.663541],
        zoom: 18
    });

    const customItemContentLayout = ymaps.templateLayoutFactory.createClass(
        // Флаг "raw" означает, что данные вставляют "как есть" без экранирования html.
        '<h2 class=ballon_header>{{ properties.balloonContentHeader|raw }}</h2>' +
        '<div class=ballon_body>{{ properties.balloonContentBody|raw }}</div>' +
        '<div class=ballon_review>{{ properties.balloonContentReview|raw }}</div>' +
        '<div class=ballon_footer>{{ properties.balloonContentFooter|raw }}</div>'
    );

    flags.myClusterer = new ymaps.Clusterer({
        clusterDisableClickZoom: true,
        clusterOpenBalloonOnClick: true,
        // Устанавливаем стандартный макет балуна кластера "Карусель".
        clusterBalloonContentLayout: 'cluster#balloonCarousel',
        // Устанавливаем собственный макет.
        clusterBalloonItemContentLayout: customItemContentLayout,
        // Устанавливаем режим открытия балуна. 
        // В данном примере балун никогда не будет открываться в режиме панели.
        clusterBalloonPanelMaxMapArea: 0,
        // Устанавливаем размеры макета контента балуна (в пикселях).
        clusterBalloonContentLayoutWidth: 200,
        clusterBalloonContentLayoutHeight: 130,
        // Устанавливаем максимальное количество элементов в нижней панели на одной странице
        clusterBalloonPagerSize: 5
        // Настройка внешего вида нижней панели.
        // Режим marker рекомендуется использовать с небольшим количеством элементов.
        // clusterBalloonPagerType: 'marker',
        // Можно отключить зацикливание списка при навигации при помощи боковых стрелок.
        // clusterBalloonCycling: false,
        // Можно отключить отображение меню навигации.
        // clusterBalloonPagerVisible: false
    });
    myMap.geoObjects.add(flags.myClusterer);

    myMap.events.add('click', onMapClick);

    flags.myClusterer.balloon.events.add('open', () => closeForm(flags));
}

/**
 * Обработчик клика по точке на карте.
 * @param {*} e 
 */
function onMapClick(e) {
    if (!flags.isInfoWindowOpened) {  // Если нет открытых форм.
        const coords = e.get('coords'),
            clientX = e.get('domEvent').get('clientX'),
            clientY = e.get('domEvent').get('clientY');
        openForm({coords, clientX, clientY, flags}).catch(errorHandler);
    }
    flags.myClusterer.balloon.close(flags.myClusterer.getClusters()[0]);
    closeForm(flags);
}

/**
 * Перехватчик кликов по элементам формы создания/просмотра отзывов.
 * @param {*} e 
 */
function onWrapperClick(e) {
    if (e.target.className === 'Close__Icon') {
        closeForm(flags);
    }

    if (e.target.className === 'AddReview') {
        addNewMarker({flags, onSinglMarkerClick});
    }
    
    if (e.target.className === 'BalloonCarousel-Address-Click') {
        e.preventDefault();
        const coords = JSON.parse(e.target.dataset.key),
            clientX = e.clientX,
            clientY = e.clientY;

        openForm({coords, clientX, clientY, flags}).then(address => {
            const data = store.getDataByKey(address);

            data.forEach(item => {
                addComment(item, flags);
            });
        }).catch(errorHandler);
        flags.myClusterer.balloon.close(flags.myClusterer.getClusters()[0]);
    }
}

/**
 * Обработчик клика по маркеру с одним отзывом.
 * @param {*} e 
 */
function onSinglMarkerClick(e) {
    e.preventDefault();
    if (!flags.activeSinglMark && !flags.isInfoWindowOpened) {
        flags.myClusterer.balloon.close(flags.myClusterer.getClusters()[0]);
        const placemark = e.get('target');

        flags.activeSinglMark = placemark;

        placemark.options.set({
            iconImageHref: 'src/image/marker_orange.png'
        });

        const coords = placemark.markerCoords,
            clientX = e.get('domEvent').get('clientX'),
            clientY = e.get('domEvent').get('clientY');

        openForm({coords, clientX, clientY, flags}).then((address) => {
            const data = store.getDataByKey(coords);

            data.forEach(item => {
                addComment(item, flags);
            });
        }).catch(errorHandler);
    }
}

/**
 * Обработать любую ошибку.
 * @param {*} error 
 */
function errorHandler(error) {
    console.error(error);
}