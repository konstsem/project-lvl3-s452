import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/js/dist/modal';
import 'bootstrap/js/dist/alert';
import { isURL } from 'validator';
import axios from 'axios';
import WatchJS from 'melanke-watchjs';
import { assign } from 'lodash';
import $ from 'jquery';

const corsProxy = 'https://cors-anywhere.herokuapp.com/';

const { watch, callWatchers } = WatchJS;

const timeInterval = 5000;

const app = () => {
  // state -> visited({ url: content })
  const state = {
    visited: [],
    inputString: 'empty',
    // return array of visited urls
    getVisitedUrls: () => state.visited.map(item => item.url),
    // saving feed to visited
    saveFeed: (url, content) => state.visited.push({ url, content }),
  };

  const setInputValidationAttr = () => {
    const inputEl = document.querySelector('input');
    const current = state.inputString;
    switch (current) {
      case 'invalid':
        inputEl.classList.remove('is-valid');
        inputEl.classList.add('is-invalid');
        break;
      case 'valid':
        inputEl.classList.remove('is-invalid');
        inputEl.classList.add('is-valid');
        break;
      default:
        inputEl.classList.remove('is-valid', 'is-invalid');
        break;
    }
  };

  // функция перерисовки rss фидов из state (view)
  const renderFeeds = () => {
    const feedArticles = articles => articles.map(({ link, title, description }) => `<li class="list-group-item d-flex justify-content-between channelItem">
        <a href="${link}">${title}</a><button type="button"
        class="btn btn-primary" data-toggle="modal" data-target="#descriptionModal"
        data-whatever="${description}">Description</button></li>`).join('');

    const feedListElement = document.querySelector('.feedsList')

    feedListElement.innerHTML = state.visited.map(({ url, content }) => `<li class="list-grop-item feed" data-url="${url}"><h5 class="channelTitle">${content.title}</h5>
    <div class="channelDiscription">${content.description}</div>
    <br>
    <ul class="list-group channelItems">${feedArticles(content.articles)}</ul></li>`).join('');
  };

  // пока корявое но рабочее решение сохранения фида (controller)
  const parseFeed = (response) => {
    const parser = new DOMParser();
    const feed = parser.parseFromString(response.data, 'text/xml');
    const newFeed = {
      title: '',
      description: '',
      articles: [],
    };
    newFeed.title = feed.querySelector('title').textContent;
    const description = feed.querySelector('description');
    // описание может отсутствовать, поэтому проверяем его наличие
    newFeed.description = description ? description.textContent : '';
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
  watch(state, 'inputString', setInputValidationAttr);

  const isValid = value => isURL(value) && !state.getVisitedUrls().includes(value);

  const checkInputValidation = (el) => {
    const { value } = el;
    if (value === '') {
      state.inputString = 'empty';
    } else if (isValid(value)) {
      state.inputString = 'valid';
    } else {
      state.inputString = 'invalid';
    }
  };

  const submit = (event) => {
    event.preventDefault();
    if (input.value !== '' && isValid(input.value)) {
      // need rewrite
      const currentUrl = input.value;
      state.inputString = 'empty';
      input.value = '';
      callAlert('info', 'Идет загрузка данных');
      axios(`${corsProxy}${currentUrl}`)
        .then((response) => {
          state.saveFeed(currentUrl, parseFeed(response));
          $('.alert').alert('close');
        })
        .catch((err) => {
          console.error(err);
          callAlert('warning', err);
        });
    }
  };

  const input = document.querySelector('input');
  input.addEventListener('input', ({ target }) => checkInputValidation(target));
  // const submitButton = document.querySelector('button');
  // submitButton.addEventListener('click', input.submit);
  const formElement = document.querySelector('form');
  formElement.addEventListener('submit', submit);

  // обновление данных rss потоков ()
  const updateRSS = () => {
    if (state.visited.length === 0) {
      setTimeout(updateRSS, timeInterval);
    } else {
      state.visited.forEach((item, i) => {
        axios(`${corsProxy}${item.url}`)
          .then((response) => {
            const receivedFeed = parseFeed(response);
            assign(item.content.articles, receivedFeed.articles);
            callWatchers(state.visited, i);
            setTimeout(updateRSS, timeInterval);
          })
          .catch((err) => {
            console.error(err);
            callAlert('warning', err);
          });
      });
    }
  };

  setTimeout(updateRSS, timeInterval);
};

// передача описания в модальное окно
$('#descriptionModal').on('show.bs.modal', function foo(event) {
  const button = $(event.relatedTarget);
  const description = button.data('whatever');
  const modal = $(this);
  modal.find('.modal-body').text(description);
});

app();
