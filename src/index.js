import {reviewTpl, reviewFormTpl} from './template.js';
import store from './store.js';

document.addEventListener("DOMContentLoaded", ready);

let myMap = null,
    isInfoWindowOpened = null, // object, если был клик по карте и открылась форма.
    myClusterer = null,
    activeSinglMark = null; // object, если был клик по маркеру с одним отзывом и открылась форма.

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

    myClusterer = new ymaps.Clusterer({
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
    myMap.geoObjects.add(myClusterer);

    myMap.events.add('click', onMapClick);

    myClusterer.balloon.events.add('open', closeForm);
}

/**
 * Обработчик клика по точке на карте.
 * @param {*} e 
 */
function onMapClick(e) {
    if (!isInfoWindowOpened) {  // Если нет открытых форм.
        const coords = e.get('coords'),
            clientX = e.get('domEvent').get('clientX'),
            clientY = e.get('domEvent').get('clientY');
        openForm({coords, clientX, clientY}).catch(errorHandler);
    }
    myClusterer.balloon.close(myClusterer.getClusters()[0]);
    closeForm();
}

/**
 * Открыть форму для просмотра/оздания отзыва.
 */
function openForm({coords, clientX, clientY}) {
    const myGeocoder = ymaps.geocode(coords),
        left = ( clientX + 380 > window.innerWidth ? clientX - 380 : clientX),
        top = (clientY + 530 > window.innerHeight ? 10 : clientY);

    return myGeocoder.then(res => {
            const address = res.geoObjects.get(0).getAddressLine(),
                render = Handlebars.compile(reviewFormTpl),
                html = render({address: address}),
                wrapper = document.querySelector('.Wrapper'),
                infoWindow = document.createElement('div');
            
            infoWindow.className = 'InfoWindow';
            infoWindow.innerHTML = html;
            infoWindow.dataset.coords = JSON.stringify(coords);
            infoWindow.dataset.address = address;

            infoWindow.style.left = `${left}px`;
            infoWindow.style.top = `${top}px`;
            wrapper.appendChild(infoWindow);
            isInfoWindowOpened = infoWindow;

            return address;
        }
    );
}

/**
 * Перехватчик кликов по элементам формы создания/просмотра отзывов.
 * @param {*} e 
 */
function onWrapperClick(e) {
    if (e.target.className === 'Close__Icon') {
        closeForm();
    }

    if (e.target.className === 'AddReview') {
        addNewMarker();
    }
    
    if (e.target.className === 'BalloonCarousel-Address-Click') {
        e.preventDefault();
        const coords = JSON.parse(e.target.dataset.key),
            clientX = e.clientX,
            clientY = e.clientY;

        openForm({coords, clientX, clientY}).then(address => {
            const data = store.getDataByKey(address);

            data.forEach(item => {
                addComment(item);
            });
        }).catch(errorHandler);
        myClusterer.balloon.close(myClusterer.getClusters()[0]);
    }
}

/**
 * Закрыть форму.
 */
function closeForm() {
    if (isInfoWindowOpened) {
        isInfoWindowOpened.remove();
        isInfoWindowOpened = null;
        if (activeSinglMark) {
            activeSinglMark.options.set({
                iconImageHref: 'src/image/marker_grey.png'
            });
            activeSinglMark = null;
        }
    }
}

/**
 * Добавить новый маркер.
 */
function addNewMarker() {
    const form = document.forms.ReviewForm,
        name = form.name.value,
        place = form.place.value,
        review = form.review.value;

    if (name.length === 0 || place.length === 0 || review.length === 0) {
        alert('Заполните все поля');
    } else {
        const key = JSON.parse(isInfoWindowOpened.dataset.coords),
            address = isInfoWindowOpened.dataset.address,
            dateNow = new Date().toLocaleString(),
            data = {name: name, place: place, review: review, date: dateNow, coords: key},
            myPlacemark = new ymaps.Placemark(key, {
                balloonContentHeader: place,
                balloonContentBody: `<a href="#" class="BalloonCarousel-Address-Click" data-key=${JSON.stringify(key)}>${address}</a>`,
                balloonContentReview: review,
                balloonContentFooter: dateNow
            }, {
                iconLayout: 'default#image',
                iconImageHref: 'src/image/marker_orange.png',
                hideIconOnBalloonOpen: false
            });
        
        myPlacemark.markerCoords = key; // Добавить ключ-координату на маркер.
        
        myPlacemark.events.add('click', onSinglMarkerClick);

        myClusterer.add(myPlacemark);

        activeSinglMark = myPlacemark;  // Метка становится активной после появления на карте, чтобы нельзя было кликать по другим.

        if (store.hasKey(address)) {
            store.appendDataInKey(address, data);
        } else {
            store.createKey(address);
            store.appendDataInKey(address, data);
        }
        if (store.hasKey(key)) {
            store.appendDataInKey(key, data);
        } else {
            store.createKey(key);
            store.appendDataInKey(key, data);
        }
        form.name.value = '';
        form.place.value = '';
        form.review.value = '';

        addComment(data);
    }
}

/**
 * Добавить комментарий в форму.
 * @param {*} data 
 */
function addComment(data) {
    const reviewList = isInfoWindowOpened.querySelector('.ReviewList'),
        render = Handlebars.compile(reviewTpl),
        reviewLi = document.createElement('li'),
        html = render(data);
    
    reviewLi.className = 'Review';
    reviewLi.innerHTML = html;
    
    if (reviewList.children.length === 0) {
        reviewList.innerHTML = '';
        reviewList.appendChild(reviewLi);
    } else {
        reviewList.appendChild(reviewLi);
    }
}

/**
 * Обработчик клика по маркеру с одним отзывом.
 * @param {*} e 
 */
function onSinglMarkerClick(e) {
    e.preventDefault();
    if (!activeSinglMark && !isInfoWindowOpened) {
        myClusterer.balloon.close(myClusterer.getClusters()[0]);
        const placemark = e.get('target');

        activeSinglMark = placemark;

        placemark.options.set({
            iconImageHref: 'src/image/marker_orange.png'
        });

        const coords = placemark.markerCoords,
            clientX = e.get('domEvent').get('clientX'),
            clientY = e.get('domEvent').get('clientY');

        openForm({coords, clientX, clientY}).then((address) => {
            const data = store.getDataByKey(coords);

            data.forEach(item => {
                addComment(item);
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