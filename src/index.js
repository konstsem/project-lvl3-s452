/* global document, DOMParser */
import 'bootstrap/dist/css/bootstrap.min.css';
import { isURL } from 'validator';
import axios from 'axios';
import WatchJS from 'melanke-watchjs';

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
    console.log('render was performed', state);
    // const channelTitle = feed.querySelector('title').textContent;
    // const channelDiscription = feed.querySelector('discription');
    // const newRSSListItem = `<ul class="list-group">
    //   <div class='channelTitle'>${channelTitle}</div>
    //   <div class='channelDiscription'>${channelDiscription ?
    // channelDiscription.textContent : ''}</div>
    // </ul>`;
    // const RSSFeeds = document.querySelector('.RSSFeeds');
    // RSSFeeds.insertAdjacentHTML('beforeend', newRSSListItem);
  };

  // пока корявое но рабочее решение сохранения фида
  const saveFeedToState = (feed) => {
    console.log(feed);
    const newFeed = {
      title: '',
      description: '',
      articles: [],
    };
    newFeed.title = feed.querySelector('title').textContent;
    const description = feed.querySelector('description');
    // описание может отсутствовать, поэтому проверяем
    if (description) {
      newFeed.description = description.textContent;
    }
    const items = feed.querySelectorAll('item');
    items.forEach((item) => {
      const newItem = {};
      newItem.title = item.querySelector('title').textContent;
      newItem.link = item.querySelector('link').textContent;
      newFeed.articles.push(newItem);
    });
    state.feeds.push(newFeed);
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
        .catch(err => console.log(err));
      input.value = '';
    }
  });
};

app();
