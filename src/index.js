import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/js/dist/modal';
import 'bootstrap/js/dist/alert';
import { isURL } from 'validator';
import axios from 'axios';
import { watch } from 'melanke-watchjs';
import { assign } from 'lodash';
import $ from 'jquery';
import render from './renderFeeds';
import messages from './messages';

const corsProxy = 'https://cors-anywhere.herokuapp.com/';

const timeInterval = 5000;
const language = 'RU';

const app = () => {
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

  const setInputString = () => {
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
  const setInputElement = () => {
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
  const parseFeed = (data) => {
    const parser = new DOMParser();
    const feed = parser.parseFromString(data, 'text/xml');
    const title = feed.querySelector('title').textContent;
    const description = feed.querySelector('description').textContent;
    const items = feed.querySelectorAll('item');
    return {
      title,
      description: description || '', // description may not exist
      articles: [...items].map(item => ({
        title: item.querySelector('title').textContent,
        link: item.querySelector('link').textContent,
        description: item.querySelector('description').textContent,
      })),
    };
  };

  const callAlert = () => {
    $('.alert').alert('close');
    const { type, message } = state.alert;
    if (type) {
      const alert = `<div class="alert alert-${type} role="alert">${messages[language][message]}</div>`;
      const body = document.querySelector('body');
      body.insertAdjacentHTML('afterbegin', alert);
    }
  };

  // watchers section
  watch(state, 'visited', () => render(state));
  watch(state, 'inputString', setInputElement);
  watch(state, 'alert', callAlert);
  watch(state, 'currentUrl', setInputString);

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
      state.alert = { type: 'info', message: 'load' };
      axios(`${corsProxy}${currentUrl}`)
        .then((response) => {
          const feed = parseFeed(response.data);
          state.saveFeed(currentUrl, feed);
          state.alert = { type: '', message: '' };
          state.currentUrl = '';
        })
        .catch((err) => {
          console.error(err);
          state.alert = { type: 'warning', message: 'error' };
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
            const receivedFeed = parseFeed(response.data);
            assign(item.content.articles, receivedFeed.articles);
            render(state);
            setTimeout(updateRSS, timeInterval);
          })
          .catch((err) => {
            console.error(err);
            state.alert = { type: 'warning', message: 'error' };
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
};

app();
