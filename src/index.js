import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/js/dist/modal';
import 'bootstrap/js/dist/alert';
import { isURL } from 'validator';
import axios from 'axios';
import { watch } from 'melanke-watchjs';
import { assign } from 'lodash';
import $ from 'jquery';
import render from './renderFeeds';

const corsProxy = 'https://cors-anywhere.herokuapp.com/';

const timeInterval = 5000;

const state = {
  visited: [],
  inputString: 'empty',
  currentUrl: '',
  alert: {
    type: '',
    message: '',
  },
  // return array of visited urls
  getVisitedUrls: () => state.visited.map(item => item.url),
  // saving feed to visited
  saveFeed: (url, content) => state.visited.push({ url, content }),
};

const isValid = value => isURL(value) && !state.getVisitedUrls().includes(value);

const checkInputValidation = () => {
  const { currentUrl } = state;
  if (currentUrl === '') {
    state.inputString = 'empty';
  } else if (isValid(currentUrl)) {
    state.inputString = 'valid';
  } else {
    state.inputString = 'invalid';
  }
};

// set attributes and value for input element
const setInput = () => {
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
      inputEl.value = '';
      break;
  }
};

// parse rss feed
const parseFeed = (feed) => {
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

const callAlert = () => {
  $('.alert').alert('close');
  const { type, message } = state.alert;
  if (type) {
    const alert = `<div class="alert alert-${type} role="alert">${message}</div>`;
    const body = document.querySelector('body');
    body.insertAdjacentHTML('afterbegin', alert);
  }
};

// watchers section
watch(state, 'visited', () => render(state));
watch(state, 'inputString', setInput);
watch(state, 'alert', callAlert);
watch(state, 'currentUrl', checkInputValidation);

// eventListeners section
const input = document.querySelector('input');
input.addEventListener('input', ({ target }) => {
  state.currentUrl = target.value;
});

const formElement = document.querySelector('form');
formElement.addEventListener('submit', (event) => {
  event.preventDefault();
  const { currentUrl } = state;
  if (currentUrl !== '' && isValid(currentUrl)) {
    state.inputString = 'empty';
    state.alert = { type: 'info', message: 'Идет загрузка данных' };
    axios(`${corsProxy}${currentUrl}`)
      .then((response) => {
        const parser = new DOMParser();
        const feed = parser.parseFromString(response.data, 'text/xml');
        state.saveFeed(currentUrl, parseFeed(feed));
        state.alert = { type: '', message: '' };
        state.currentUrl = '';
      })
      .catch((err) => {
        console.error(err);
        state.alert = { type: 'warning', message: err };
      });
  }
});

// update rss data
const updateRSS = () => {
  if (state.visited.length === 0) {
    setTimeout(updateRSS, timeInterval);
  } else {
    state.visited.forEach((item) => {
      axios(`${corsProxy}${item.url}`)
        .then((response) => {
          const parser = new DOMParser();
          const feed = parser.parseFromString(response.data, 'text/xml');
          const receivedFeed = parseFeed(feed);
          assign(item.content.articles, receivedFeed.articles);
          // callWatchers(state.visited);
          render(state);
          setTimeout(updateRSS, timeInterval);
        })
        .catch((err) => {
          console.error(err);
          state.alert = { type: 'warning', message: err };
        });
    });
  }
};

// start update rss data
setTimeout(updateRSS, timeInterval);

// send description to modal
$('#descriptionModal').on('show.bs.modal', function foo(event) {
  const button = $(event.relatedTarget);
  const description = button.data('whatever');
  const modal = $(this);
  modal.find('.modal-body').text(description);
});
