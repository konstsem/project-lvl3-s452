// rerender rss feeds from state
const renderFeeds = (state) => {
  const feedArticles = articles => articles.map(({ link, title, description }) => `<li class="list-group-item d-flex justify-content-between channelItem">
      <a href="${link}">${title}</a><button type="button"
      class="btn btn-primary" data-toggle="modal" data-target="#descriptionModal"
      data-whatever="${description}">Description</button></li>`).join('');

  const feedListElement = document.querySelector('.feedsList');

  feedListElement.innerHTML = state.visited.map(({ url, content }) => `<li class="list-grop-item feed" data-url="${url}"><h5 class="channelTitle">${content.title}</h5>
  <div class="channelDiscription">${content.description}</div>
  <br>
    <ul class="list-group channelItems">${feedArticles(content.articles)}</ul></li><br>`).join('');
};

export default renderFeeds;
