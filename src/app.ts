import type { Country } from './country-types.js';
import type { SearchErrorKind } from './search-errors.js';
import { CountrySearchController, type SearchViewState } from './search-controller.js';

const page = document.createElement('main');
page.className = 'page-shell';
page.append(createHeader(), createSearchPanel());
document.body.append(page);

const searchInput = page.querySelector<HTMLInputElement>('#country-search');
const searchForm = page.querySelector<HTMLFormElement>('.search-form');
const clearButton = page.querySelector<HTMLButtonElement>('.clear-button');
const statusRegion = page.querySelector<HTMLElement>('.search-status');
const resultsRegion = page.querySelector<HTMLElement>('.country-grid');
const dialog = createDialog();

if (!searchInput || !searchForm || !clearButton || !statusRegion || !resultsRegion) {
  throw new Error('Country search interface could not be initialized');
}

document.body.append(dialog);

const controller = new CountrySearchController(renderState, 300, 10_000);

searchInput.addEventListener('input', () => {
  clearButton.hidden = searchInput.value.length === 0;
  controller.onInput(searchInput.value);
});

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  controller.retry();
});

clearButton.addEventListener('click', () => {
  searchInput.value = '';
  clearButton.hidden = true;
  searchInput.focus();
  controller.onInput('');
});

window.addEventListener('pagehide', () => controller.destroy(), { once: true });

function createHeader(): HTMLElement {
  const header = document.createElement('header');
  header.className = 'hero';

  const eyebrow = document.createElement('p');
  eyebrow.className = 'eyebrow';
  eyebrow.textContent = 'A LITTLE CLOSER TO EVERYWHERE';

  const title = document.createElement('h1');
  title.append('The world, ', createAccent('at your fingertips.'));

  const introduction = document.createElement('p');
  introduction.className = 'hero-copy';
  introduction.textContent =
    'Look up a country and discover the places, people, and details that make it unique.';

  header.append(eyebrow, title, introduction);
  return header;
}

function createAccent(text: string): HTMLElement {
  const accent = document.createElement('span');
  accent.className = 'title-accent';
  accent.textContent = text;
  return accent;
}

function createSearchPanel(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'search-panel';
  section.setAttribute('aria-label', 'Country search');

  const form = document.createElement('form');
  form.className = 'search-form';

  const label = document.createElement('label');
  label.htmlFor = 'country-search';
  label.className = 'search-label';
  label.textContent = 'Find a country';

  const field = document.createElement('div');
  field.className = 'search-field';

  const icon = document.createElement('span');
  icon.className = 'search-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '⌕';

  const input = document.createElement('input');
  input.id = 'country-search';
  input.type = 'search';
  input.name = 'country';
  input.placeholder = 'Try Finland, Japan, or Costa Rica';
  input.autocomplete = 'off';
  input.spellcheck = false;

  const clear = document.createElement('button');
  clear.className = 'clear-button';
  clear.type = 'button';
  clear.setAttribute('aria-label', 'Clear search');
  clear.textContent = '×';
  clear.hidden = true;

  const submit = document.createElement('button');
  submit.className = 'search-button';
  submit.type = 'submit';
  submit.textContent = 'Search';

  field.append(icon, input, clear, submit);
  form.append(label, field);

  const status = document.createElement('div');
  status.className = 'search-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.append(createIdleMessage());

  const grid = document.createElement('div');
  grid.className = 'country-grid';
  grid.setAttribute('aria-label', 'Country results');

  section.append(form, status, grid);
  return section;
}

function createIdleMessage(): HTMLElement {
  const message = document.createElement('p');
  message.className = 'status-message';
  message.textContent = 'Start typing to explore the world.';
  return message;
}

function renderState(state: SearchViewState): void {
  if (!statusRegion || !resultsRegion) return;
  statusRegion.replaceChildren();
  resultsRegion.replaceChildren();
  statusRegion.dataset.state = state.status;

  switch (state.status) {
    case 'idle': {
      statusRegion.append(createIdleMessage());
      break;
    }
    case 'loading': {
      const wrapper = document.createElement('div');
      wrapper.className = 'loading-message';
      const spinner = document.createElement('span');
      spinner.className = 'spinner';
      spinner.setAttribute('aria-hidden', 'true');
      const message = document.createElement('p');
      message.textContent = `Finding places named “${state.query}”…`;
      wrapper.append(spinner, message);
      statusRegion.append(wrapper);
      break;
    }
    case 'empty': {
      const message = document.createElement('p');
      message.className = 'status-message';
      message.textContent = `No countries found for “${state.query}”. Try another spelling.`;
      statusRegion.append(message);
      break;
    }
    case 'results': {
      const count = document.createElement('p');
      count.className = 'results-count';
      count.textContent = `${state.countries.length} ${
        state.countries.length === 1 ? 'place' : 'places'
      } found`;
      statusRegion.append(count);
      state.countries.forEach((country) => resultsRegion.append(createCountryCard(country)));
      break;
    }
    case 'error': {
      const wrapper = document.createElement('div');
      wrapper.className = 'error-message';
      const message = document.createElement('p');
      message.textContent = errorMessage(state.kind);
      const retryButton = document.createElement('button');
      retryButton.className = 'retry-button';
      retryButton.type = 'button';
      retryButton.textContent = 'Try again';
      retryButton.addEventListener('click', () => controller.retry());
      wrapper.append(message, retryButton);
      statusRegion.append(wrapper);
      break;
    }
  }
}

function errorMessage(kind: Exclude<SearchErrorKind, 'abort'>): string {
  if (kind === 'timeout') return 'The search took too long. Check your connection and try again.';
  if (kind === 'http') return 'The country service is temporarily unavailable. Please try again.';
  return 'We could not reach the country service. Check your connection and try again.';
}

function createCountryCard(country: Country): HTMLButtonElement {
  const card = document.createElement('button');
  card.className = 'country-card';
  card.type = 'button';
  card.setAttribute('aria-label', `View details for ${country.name}`);

  const flag = document.createElement('span');
  flag.className = 'country-flag';
  flag.setAttribute('aria-hidden', 'true');
  flag.textContent = country.flag || '🌐';

  const content = document.createElement('span');
  content.className = 'country-card-content';

  const name = document.createElement('span');
  name.className = 'country-name';
  name.textContent = country.name;

  const metadata = document.createElement('span');
  metadata.className = 'country-meta';
  metadata.textContent = `${country.capital} · ${country.region}`;

  const population = document.createElement('span');
  population.className = 'country-population';
  population.textContent = `${country.population.toLocaleString()} people`;

  const arrow = document.createElement('span');
  arrow.className = 'card-arrow';
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '↗';

  content.append(name, metadata, population);
  card.append(flag, content, arrow);
  card.addEventListener('click', () => openCountryDetails(country));
  return card;
}

function createDialog(): HTMLDialogElement {
  const element = document.createElement('dialog');
  element.className = 'country-dialog';
  element.addEventListener('click', (event) => {
    if (event.target === element) element.close();
  });
  return element;
}

function openCountryDetails(country: Country): void {
  dialog.replaceChildren();

  const closeButton = document.createElement('button');
  closeButton.className = 'dialog-close';
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', 'Close country details');
  closeButton.textContent = '×';
  closeButton.addEventListener('click', () => dialog.close());

  const flag = document.createElement('p');
  flag.className = 'dialog-flag';
  flag.setAttribute('aria-hidden', 'true');
  flag.textContent = country.flag || '🌐';

  const title = document.createElement('h2');
  title.textContent = country.name;

  const description = document.createElement('p');
  description.className = 'dialog-description';
  description.textContent = country.description;

  const details = document.createElement('dl');
  details.className = 'detail-list';
  addDetail(details, 'Capital', country.capital);
  addDetail(details, 'Region', country.region);
  addDetail(details, 'Population', country.population.toLocaleString());
  addDetail(
    details,
    'Area',
    country.area === null ? 'Not listed' : `${country.area.toLocaleString()} km²`,
  );
  addDetail(details, 'Borders', country.borders.join(', ') || 'No land borders');
  addDetail(details, 'Languages', country.languages.join(', ') || 'Not listed');
  addDetail(details, 'Currencies', country.currencies.join(', ') || 'Not listed');

  dialog.append(closeButton, flag, title, description, details);
  dialog.showModal();
  closeButton.focus();
}

function addDetail(list: HTMLDListElement, label: string, value: string): void {
  const term = document.createElement('dt');
  term.textContent = label;
  const description = document.createElement('dd');
  description.textContent = value;
  list.append(term, description);
}
