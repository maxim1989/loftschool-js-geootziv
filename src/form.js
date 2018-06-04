import {reviewTpl, reviewFormTpl} from './template.js';
import store from './store.js';

/**
 * Открыть форму для просмотра/оздания отзыва.
 */
function openForm({coords, clientX, clientY, flags}) {
    const myGeocoder = ymaps.geocode(coords),
        left = (clientX + 380 >= window.innerWidth ? clientX - 380 : clientX),
        top = (clientY + 530 >= window.innerHeight ? 10 : clientY - 15);

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
            flags.isInfoWindowOpened = infoWindow;

            return address;
        }
    );
}

/**
 * Добавить комментарий в форму.
 * @param {*} data 
 */
function addComment(data, flags) {
    const reviewList = flags.isInfoWindowOpened.querySelector('.ReviewList'),
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
 * Закрыть форму.
 */
function closeForm(flags) {
    if (flags.isInfoWindowOpened) {
        flags.isInfoWindowOpened.remove();
        flags.isInfoWindowOpened = null;
        if (flags.activeSinglMark) {
            flags.activeSinglMark.options.set({
                iconImageHref: 'src/image/marker_grey.png'
            });
            flags.activeSinglMark = null;
        }
    }
}

/**
 * Добавить новый маркер.
 */
function addNewMarker({flags, onSinglMarkerClick}) {
    const form = document.forms.ReviewForm,
        name = form.name.value,
        place = form.place.value,
        review = form.review.value;

    if (name.length === 0 || place.length === 0 || review.length === 0) {
        alert('Заполните все поля');
    } else {
        const key = JSON.parse(flags.isInfoWindowOpened.dataset.coords),
            address = flags.isInfoWindowOpened.dataset.address,
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

        flags.myClusterer.add(myPlacemark);

        flags.activeSinglMark = myPlacemark;  // Метка становится активной после появления на карте, чтобы нельзя было кликать по другим.

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

        addComment(data, flags);
    }
}

export {openForm, addComment, closeForm, addNewMarker};