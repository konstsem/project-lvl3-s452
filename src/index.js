/* global document */
import 'bootstrap/dist/css/bootstrap.min.css';
import { isURL } from 'validator';
// import axios from 'axios';

// const corsProxy = 'https://cors-anywhere.herokuapp.com/';

// const parser = new DOMParser();

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

  const render = () => {
    const rssList = document.querySelector('.list');
    const li = document.createElement('li');
    li.textContent = 'Nothing';
    rssList.append(li);
  };

  const input = document.querySelector('input');
  input.addEventListener('input', (event) => {
    setBorderColor(input, event.target.value);
  });
  const button = document.querySelector('button');
  button.addEventListener('click', () => {
    if (!!input.value && isURL(input.value) && !state.visited.includes(input.value)) {
      state.visited.push(input.value);
      // axios(`${corsProxy}${input.value}`)
      //   .then(res => parser.parseFromString(res.data, 'application/xml'))
      // .then(data => data.querySelectorAll('item'))
      // .then(console.log)
      // .catch(err => console.log(err));

      render();

      input.value = '';
    }
  });
};

app();
