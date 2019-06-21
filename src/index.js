/* global document, DOMParser */
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/js/dist/modal';
import { isURL } from 'validator';
import axios from 'axios';
import WatchJS from 'melanke-watchjs';
import $ from 'jquery';

const corsProxy = 'https://cors-anywhere.herokuapp.com/';

const parser = new DOMParser();
const { watch } = WatchJS;

const app = () => {
  // в visitedURL хранятся посещенные линки
  // в feeds будут хранится наименование, описание и статьи из rss feeds
  const state = {
    visitedURL: [],
    feeds: [],
  };
  const setBorderColor = (el, inputValue) => {
    if ((inputValue !== '' && !isURL(inputValue)) || state.visitedURL.includes(inputValue)) {
      el.classList.add('is-invalid');
    } else {
      el.classList.remove('is-invalid');
    }
  };

  // функция перерисовки rss фидов из state
  const renderFeeds = () => {
    const newFeed = state.feeds[state.feeds.length - 1];
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

  // пока корявое но рабочее решение сохранения фида
  const saveFeedToState = (feed) => {
    // console.log(feed);
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
    state.feeds.push(newFeed);
    // console.log(state);
  };

  watch(state, 'feeds', renderFeeds);

  // нужно написать функцию isValid или что то подобное
  // и убрать проверку в двух лиснерах
  const input = document.querySelector('input');
  input.addEventListener('input', (event) => {
    setBorderColor(input, event.target.value);
  });
  const button = document.querySelector('button');
  button.addEventListener('click', () => {
    if (!!input.value && isURL(input.value) && !state.visitedURL.includes(input.value)) {
      state.visitedURL.push(input.value);
      axios(`${corsProxy}${input.value}`)
        .then(res => parser.parseFromString(res.data, 'text/xml'))
        .then(saveFeedToState)
        // нужно написать обработку ошибок, для вывода пользователю
        .catch(err => console.log(err));
      input.value = '';
    }
  });
};

$('#descriptionModal').on('show.bs.modal', function foo(event) {
  const button = $(event.relatedTarget); // Button that triggered the modal
  const description = button.data('whatever'); // Extract info from data-* attributes
  const modal = $(this);
  // modal.find('.modal-title').text('New message to ' + recipient)
  modal.find('.modal-body').text(description);
});

app();
