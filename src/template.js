// Шаблон отзыва.
const reviewTpl = `<div class="Review__Header">
                           <p class="Reviewer">{{name}}</p>
                           <p class="Place">{{place}}</p>
                           <p class="Date">{{date}}</p>
                       </div>
                       <div class="Review__Text">
                           {{review}}
                       </div>`,
// Шаблон формы создания/просмотра отзыва.
    reviewFormTpl = `<div class="Header">
                             <div class="Marker">
                                 <img src="src/image/marker_small.png" alt="marker" class="Marker__Small">
                                 <p class="Marker__Address">
                                     {{ address }}
                                 </p>
                             </div>
                             <div class="Close">
                                 <img src="src/image/close.png" alt="close" class="Close__Icon">
                             </div>
                         </div>
                         <div class="Body">
                             <ul class="ReviewList">
                                 Отзывов пока нет...
                             </ul>
                             <div class="FormTitle">
                                 ВАШ ОТЗЫВ
                             </div>
                             <form class="ReviewForm" name="ReviewForm">
                                 <input type="text" class="ReviewFormName" name="name" placeholder="Ваше имя" required>
                                 <input type="text" class="ReviewFormPlace" name="place" placeholder="Укажите место" required>
                                 <textarea name="review" class="ReviewFormReview" placeholder="Поделитесь впечатлениями" required></textarea>
                             </form>
                         </div>
                         <div class="Footer">
                             <div class="AddReview">
                                 Добавить
                             </div>
                         </div>`;

export {reviewTpl};
export {reviewFormTpl};