import './style.css';

const STORAGE_KEY = 'demo:workspace-history-porter:sample:v1';

type SampleEntry = {
  kind: 'Task' | 'Note' | 'Link';
  title: string;
  note: string;
  status: 'To do' | 'In progress' | 'Done';
  url?: string;
};

type SampleJournal = { entries: SampleEntry[] };

function seedJournal(): SampleJournal {
  return {
    entries: [
      { kind: 'Task', title: 'Run integration tests before the deploy', note: 'The migration is ready. Confirm the staging test report before merging.', status: 'In progress' },
      { kind: 'Note', title: 'Handoff for the next browser', note: 'The preview uses the remote API workspace. Start with the failing webhook case.', status: 'To do' },
      { kind: 'Link', title: 'Pull request #482', note: 'Review the schema change and the test notes.', status: 'Done', url: 'https://github.com/example/remote-api/pull/482' }
    ]
  };
}

function readJournal(): SampleJournal {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as SampleJournal | null;
    if (value && Array.isArray(value.entries)) return value;
  } catch {
    // A broken demo value is replaced with the known sample below.
  }
  const journal = seedJournal();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(journal));
  return journal;
}

function saveJournal(journal: SampleJournal) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(journal));
}

let journal = readJournal();
const entries = document.querySelector<HTMLOListElement>('#demo-entries')!;
const summary = document.querySelector<HTMLElement>('#demo-summary')!;
const status = document.querySelector<HTMLElement>('#demo-status')!;

function render() {
  entries.replaceChildren();
  const open = journal.entries.filter((entry) => entry.status !== 'Done').length;
  summary.textContent = `${open} open · ${journal.entries.length} total · Sample workspace`;
  for (const entry of journal.entries) {
    const item = document.createElement('li');
    item.className = 'demo-entry';
    const copy = document.createElement('div');
    const label = document.createElement('p');
    label.className = 'demo-entry-kind';
    label.textContent = `${entry.kind} · ${entry.status}`;
    const title = document.createElement('h3');
    title.textContent = entry.title;
    const note = document.createElement('p');
    note.textContent = entry.note;
    copy.append(label, title, note);
    if (entry.url) {
      const link = document.createElement('a');
      link.href = entry.url;
      link.target = '_blank';
      link.rel = 'noreferrer';
      link.textContent = 'Open saved link';
      copy.append(link);
    }
    const state = document.createElement('span');
    state.className = `demo-entry-state ${entry.status.toLowerCase().replaceAll(' ', '-')}`;
    state.textContent = entry.status;
    item.append(copy, state);
    entries.append(item);
  }
}

document.querySelector<HTMLFormElement>('#demo-add-form')!.addEventListener('submit', (event) => {
  event.preventDefault();
  const input = document.querySelector<HTMLInputElement>('#demo-task')!;
  const title = input.value.trim();
  if (!title) return;
  journal = { entries: [{ kind: 'Task', title, note: 'Added in the sample journal. Reset the demo to remove it.', status: 'To do' }, ...journal.entries] };
  saveJournal(journal);
  input.value = '';
  status.textContent = 'Sample task added. It is stored only in demo data.';
  render();
});

document.querySelector<HTMLButtonElement>('#reset-demo')!.addEventListener('click', () => {
  journal = seedJournal();
  saveJournal(journal);
  status.textContent = 'Demo reset to the original sample.';
  render();
});

document.querySelector<HTMLAnchorElement>('#start-real')!.addEventListener('click', () => localStorage.removeItem(STORAGE_KEY));

render();
