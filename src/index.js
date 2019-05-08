/* global document */
import 'bootstrap/dist/css/bootstrap.min.css';
import { isURL } from 'validator';
import axios from 'axios';

const corsProxy = 'https://cors-anywhere.herokuapp.com/';

const parser = new DOMParser();

const app = () => {
  const state = {
    visited: [],
  };
  const setBorderColor = (el, inputValue) => {
    if ((inputValue !== '' && !isURL(inputValue)) || state.visited.includes(inputValue)) {
      el.classList.add('is-invalid');
    } else {
      el.classList.remove('is-invalid');
    }
  };

  const renderFeed = (feed) => {
    const channelTitle = feed.querySelector('title').textContent;
    const channelDiscription = feed.querySelector('discription');
    const newRSSListItem =
    `<ul class="list-group">
      <div class='channelTitle'>${channelTitle}</div>
      <div class='channelDiscription'>${channelDiscription ? channelDiscription.textContent : ''}</div>
    </ul>`;
    const RSSFeeds = document.querySelector('.RSSFeeds');
    RSSFeeds.insertAdjacentHTML('beforeend', newRSSListItem);
  };

  const input = document.querySelector('input');
  input.addEventListener('input', (event) => {
    setBorderColor(input, event.target.value);
  });
  const button = document.querySelector('button');
  button.addEventListener('click', () => {
    if (!!input.value && isURL(input.value) && !state.visited.includes(input.value)) {
      state.visited.push(input.value);
      axios(`${corsProxy}${input.value}`)
        .then(res => parser.parseFromString(res.data, 'text/xml'))
        .then(renderFeed)
        .catch(err => console.log(err));
      input.value = '';
    }
  });
};

app();
