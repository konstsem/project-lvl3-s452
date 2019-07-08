/* global document, DOMParser */
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/js/dist/modal';
import 'bootstrap/js/dist/alert';
import { isURL } from 'validator';
import axios from 'axios';
import WatchJS from 'melanke-watchjs';
// import _ from 'lodash';
import $ from 'jquery';

const corsProxy = 'https://cors-anywhere.herokuapp.com/';

const parser = new DOMParser();
const { watch } = WatchJS;

const timeInterval = 5000;

const app = () => {
  // state -> visited(arr) -> { url, content }
  const state = {
    visited: [],
    // return array of visited urls
    getVisitedUrls: () => state.visited.reduce((acc, item) => [...acc, item.url], []),
    //  saving feed to visited
    saveFeedToState: (url, content) => state.visited.push({ url, content }),
  };

  // функция, устанавливающая цвет бордюра, в зависимости от валидации (view)
  const setBorderColor = (el, inputValue) => {
    if ((inputValue !== '' && !isURL(inputValue)) || state.getVisitedUrls().includes(inputValue)) {
      el.classList.add('is-invalid');
    } else {
      el.classList.remove('is-invalid');
    }
  };

  // функция перерисовки rss фидов из state (view)
  const renderFeeds = () => {
    // пока происходит отрисовка последнего фида
    // сейчас нужно переписать так, чтобы перерисовывались все фиды
    // но желательно не целиком, а лишь новые items
    const newFeed = state.visited[state.visited.length - 1].content;
    const newListItem = document.createElement('li');
    newListItem.classList.add('list-group-item', 'feed');

    const feedItems = newFeed.articles
      .reduce((acc, item) => `${acc}<li class="list-group-item d-flex justify-content-between channelItem">
        <a href="${item.link}">${item.title}</a><button type="button"
        class="btn btn-primary" data-toggle="modal" data-target="#descriptionModal"
        data-whatever="${item.description}">Description</button></li>`, '');

    const feedContent = `<h5 class="channelTitle">${newFeed.title}</h5>
    <div class="channelDiscription">${newFeed.description}</div>
    <ul class="list-group channelItems">${feedItems}</ul>`;
    newListItem.insertAdjacentHTML('beforeend', feedContent);

    const RSSFeeds = document.querySelector('.feedsList');
    RSSFeeds.append(newListItem);
  };

  // пока корявое но рабочее решение сохранения фида (controller)
  const getFeedAsObject = (feed) => {
    const newFeed = {
      title: '',
      description: '',
      articles: [],
    };
    newFeed.title = feed.querySelector('title').textContent;
    const description = feed.querySelector('description');
    // описание может отсутствовать, поэтому проверяем его наличие
    if (description) {
      newFeed.description = description.textContent;
    }
    const items = feed.querySelectorAll('item');
    items.forEach((item) => {
      const newItem = {};
      newItem.title = item.querySelector('title').textContent;
      newItem.link = item.querySelector('link').textContent;
      newItem.description = item.querySelector('description').textContent;
      newFeed.articles.push(newItem);
    });
    return newFeed;
  };

  const callAlert = (alertType, text) => {
    $('.alert').alert('close');
    const alert = `<div class="alert alert-${alertType} role="alert">${text}</div>`;
    const body = document.querySelector('body');
    body.insertAdjacentHTML('afterbegin', alert);
  };

  watch(state, 'visited', renderFeeds);

  // нужно написать функцию isValid или что то подобное
  // и убрать проверку в двух лиснерах
  const input = document.querySelector('input');
  input.addEventListener('input', (event) => {
    setBorderColor(input, event.target.value);
  });
  const button = document.querySelector('button');
  button.addEventListener('click', () => {
    if (!!input.value && isURL(input.value) && !state.getVisitedUrls().includes(input.value)) {
      // need rewrite
      const currentUrl = input.value;
      input.value = '';
      callAlert('info', 'Идет загрузка данных');
      axios(`${corsProxy}${currentUrl}`)
        .then(res => parser.parseFromString(res.data, 'text/xml'))
        .then((feed) => {
          state.saveFeedToState(currentUrl, getFeedAsObject(feed));
          $('.alert').alert('close');
        })
        .catch((err) => {
          console.log(err);
          callAlert('warning', err);
        });
    }
  });

  // обновление данных rss потоков ()
  setInterval(() => state.getVisitedUrls().forEach(console.log), timeInterval);
};

// передача описания в модальное окно
$('#descriptionModal').on('show.bs.modal', function foo(event) {
  const button = $(event.relatedTarget);
  const description = button.data('whatever');
  const modal = $(this);
  // modal.find('.modal-title').text('New message to ' + recipient)
  modal.find('.modal-body').text(description);
});

app();
