import { fireEvent, render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, onTestFinished, vi } from 'vitest';
import PillTabs from './PillTabs.svelte';

const TABS = [
  { value: 'regulars', text: 'Series Regulars', count: '24' },
  { value: 'guest', text: 'Guest Stars', count: '112' },
  { value: 'crew', text: 'Crew' },
];

const children = createRawSnippet((value: () => string) => ({
  render: () => `<p>Pane ${value()}</p>`,
}));

function renderTabs(props: { value?: string; tabs?: typeof TABS } = {}) {
  const onValueChange = vi.fn();
  render(PillTabs, {
    props: {
      label: 'Actors',
      tabs: TABS,
      value: 'regulars',
      onValueChange,
      children,
      ...props,
    },
  });

  return { onValueChange };
}

describe('component: PillTabs', () => {
  it('should name its tablist by the label', () => {
    renderTabs();

    expect(screen.getByRole('tablist', { name: 'Actors' })).toBeVisible();
  });

  it('should render each tab as a button, selecting the active one', () => {
    renderTabs({ value: 'guest' });

    const tabs = screen.getAllByRole('tab');

    expect(tabs.map((tab) => tab.tagName)).toEqual([
      'BUTTON',
      'BUTTON',
      'BUTTON',
    ]);
    expect(tabs.map((tab) => tab.getAttribute('aria-selected'))).toEqual([
      'false',
      'true',
      'false',
    ]);
  });

  it('should hold one tabpanel that every tab controls', () => {
    renderTabs();

    const panel = screen.getByRole('tabpanel');

    expect(screen.getAllByRole('tabpanel')).toHaveLength(1);
    expect(panel.id).not.toBe('');
    expect(
      screen.getAllByRole('tab').map((tab) =>
        tab.getAttribute('aria-controls')
      ),
    ).toEqual([panel.id, panel.id, panel.id]);
  });

  it('should label the tabpanel by the active tab', () => {
    renderTabs({ value: 'crew' });

    expect(screen.getByRole('tabpanel', { name: 'Crew' }))
      .toBeVisible();
  });

  it('should render the active pane from its value', () => {
    renderTabs({ value: 'guest' });

    expect(screen.getByRole('tabpanel')).toHaveTextContent('Pane guest');
  });

  it('should mark only the active tab for the active pill style', () => {
    renderTabs({ value: 'guest' });

    expect(
      screen.getAllByRole('tab').map((tab) =>
        tab.classList.contains('is-active')
      ),
    ).toEqual([false, true, false]);
  });

  it('should make the active tab the only one Tab reaches', () => {
    renderTabs({ value: 'guest' });

    expect(
      screen.getAllByRole('tab').map((tab) => tab.getAttribute('tabindex')),
    ).toEqual(['-1', '0', '-1']);
  });

  it('should pass the value of a clicked tab on', async () => {
    const { onValueChange } = renderTabs();

    await userEvent.click(screen.getByRole('tab', { name: 'Crew' }));

    expect(onValueChange.mock.calls).toEqual([['crew']]);
  });

  it('should pass the value of the active tab on when it is clicked', async () => {
    const { onValueChange } = renderTabs({ value: 'crew' });

    await userEvent.click(screen.getByRole('tab', { name: 'Crew' }));

    expect(onValueChange.mock.calls).toEqual([['crew']]);
  });

  it('should show the count text beside each tab given one, an empty one included', () => {
    renderTabs({
      tabs: [
        { value: 'recent', text: 'Recent', count: '30 Days' },
        { value: 'all', text: 'All', count: '' },
        { value: 'crew', text: 'Crew' },
      ],
      value: 'recent',
    });

    expect(screen.getByRole('tab', { name: 'Recent 30 Days' })).toBeVisible();
    expect(
      screen.getAllByRole('tab').map((tab) =>
        tab.querySelector('.pill-tab-count')?.textContent
      ),
    ).toEqual(['30 Days', '', undefined]);
  });

  it('should render a single tab as a tablist of one', () => {
    renderTabs({
      tabs: [{ value: 'cast', text: 'Cast', count: '9' }],
      value: 'cast',
    });

    const tablist = screen.getByRole('tablist', { name: 'Actors' });

    expect(tablist.querySelectorAll('[role="tab"]')).toHaveLength(1);
    expect(screen.getByRole('tab', { name: 'Cast 9', selected: true }))
      .toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tabpanel', { name: 'Cast 9' }))
      .toHaveTextContent('Pane cast');
  });

  describe('when no tab holds the value', () => {
    it('should select the first tab and keep it reachable', () => {
      renderTabs({ value: 'unknown' });

      const tabs = screen.getAllByRole('tab');

      expect(tabs.map((tab) => tab.getAttribute('aria-selected'))).toEqual([
        'true',
        'false',
        'false',
      ]);
      expect(tabs.map((tab) => tab.getAttribute('tabindex'))).toEqual([
        '0',
        '-1',
        '-1',
      ]);
      expect(tabs.map((tab) => tab.classList.contains('is-active'))).toEqual([
        true,
        false,
        false,
      ]);
    });

    it('should name the tabpanel by the first tab and render its pane', () => {
      renderTabs({ value: 'unknown' });

      expect(screen.getByRole('tabpanel', { name: 'Series Regulars 24' }))
        .toHaveTextContent('Pane regulars');
    });

    it('should report the first tab when it is clicked', async () => {
      const { onValueChange } = renderTabs({ value: 'unknown' });

      await userEvent.click(
        screen.getByRole('tab', { name: 'Series Regulars 24' }),
      );

      expect(onValueChange.mock.calls).toEqual([['regulars']]);
    });
  });

  it('should leave the tabpanel unnamed and empty when there are no tabs', () => {
    renderTabs({ tabs: [] });

    const panel = screen.getByRole('tabpanel');

    expect(panel).not.toHaveAttribute('aria-labelledby');
    expect(panel).toBeEmptyDOMElement();
  });

  describe('from the keyboard', () => {
    it('should move to and select the next tab on ArrowRight', async () => {
      const { onValueChange } = renderTabs();

      screen.getByRole('tab', { name: 'Series Regulars 24' }).focus();
      await userEvent.keyboard('{ArrowRight}');

      expect(screen.getByRole('tab', { name: 'Guest Stars 112' }))
        .toHaveFocus();
      expect(onValueChange.mock.calls).toEqual([['guest']]);
    });

    it('should wrap from the last tab to the first on ArrowRight', async () => {
      const { onValueChange } = renderTabs({ value: 'crew' });

      screen.getByRole('tab', { name: 'Crew' }).focus();
      await userEvent.keyboard('{ArrowRight}');

      expect(screen.getByRole('tab', { name: 'Series Regulars 24' }))
        .toHaveFocus();
      expect(onValueChange.mock.calls).toEqual([['regulars']]);
    });

    it('should move to and select the previous tab on ArrowLeft', async () => {
      const { onValueChange } = renderTabs({ value: 'crew' });

      screen.getByRole('tab', { name: 'Crew' }).focus();
      await userEvent.keyboard('{ArrowLeft}');

      expect(screen.getByRole('tab', { name: 'Guest Stars 112' }))
        .toHaveFocus();
      expect(onValueChange.mock.calls).toEqual([['guest']]);
    });

    it('should wrap from the first tab to the last on ArrowLeft', async () => {
      const { onValueChange } = renderTabs();

      screen.getByRole('tab', { name: 'Series Regulars 24' }).focus();
      await userEvent.keyboard('{ArrowLeft}');

      expect(screen.getByRole('tab', { name: 'Crew' })).toHaveFocus();
      expect(onValueChange.mock.calls).toEqual([['crew']]);
    });

    it('should move to and select the first tab on Home', async () => {
      const { onValueChange } = renderTabs({ value: 'crew' });

      screen.getByRole('tab', { name: 'Crew' }).focus();
      await userEvent.keyboard('{Home}');

      expect(screen.getByRole('tab', { name: 'Series Regulars 24' }))
        .toHaveFocus();
      expect(onValueChange.mock.calls).toEqual([['regulars']]);
    });

    it('should move to and select the last tab on End', async () => {
      const { onValueChange } = renderTabs();

      screen.getByRole('tab', { name: 'Series Regulars 24' }).focus();
      await userEvent.keyboard('{End}');

      expect(screen.getByRole('tab', { name: 'Crew' })).toHaveFocus();
      expect(onValueChange.mock.calls).toEqual([['crew']]);
    });

    it.each([
      { key: 'ArrowRight', name: 'Series Regulars 24', next: 'regulars' },
      { key: 'ArrowLeft', name: 'Crew', next: 'crew' },
    ])(
      'should follow a right-to-left document on $key',
      async ({ key, name, next }) => {
        document.documentElement.dir = 'rtl';
        onTestFinished(() => {
          document.documentElement.removeAttribute('dir');
        });
        const { onValueChange } = renderTabs({ value: 'guest' });

        screen.getByRole('tab', { name: 'Guest Stars 112' }).focus();
        await userEvent.keyboard(`{${key}}`);

        expect(screen.getByRole('tab', { name })).toHaveFocus();
        expect(onValueChange.mock.calls).toEqual([[next]]);
      },
    );

    it('should report every target of a burst the value has not caught up with', async () => {
      const { onValueChange } = renderTabs();

      screen.getByRole('tab', { name: 'Series Regulars 24' }).focus();
      await userEvent.keyboard('{ArrowRight>4/}');

      expect(screen.getByRole('tab', { name: 'Guest Stars 112' }))
        .toHaveFocus();
      expect(onValueChange.mock.calls).toEqual([
        ['guest'],
        ['crew'],
        ['regulars'],
        ['guest'],
      ]);
    });

    it('should keep the page from scrolling on the keys it handles', async () => {
      renderTabs();

      const handled = await fireEvent.keyDown(
        screen.getByRole('tab', { name: 'Series Regulars 24' }),
        { key: 'End' },
      );

      expect(handled).toBe(false);
    });

    it.each(['altKey', 'metaKey', 'ctrlKey'])(
      'should leave an arrow key alone while %s is held',
      async (modifier) => {
        const { onValueChange } = renderTabs();
        const tab = screen.getByRole('tab', { name: 'Series Regulars 24' });

        tab.focus();
        const handled = await fireEvent.keyDown(tab, {
          key: 'ArrowLeft',
          [modifier]: true,
        });

        expect(handled).toBe(true);
        expect(tab).toHaveFocus();
        expect(onValueChange).not.toHaveBeenCalled();
      },
    );

    it('should leave other keys alone', async () => {
      const { onValueChange } = renderTabs();
      const tab = screen.getByRole('tab', { name: 'Series Regulars 24' });

      tab.focus();
      const handled = await fireEvent.keyDown(tab, { key: 'ArrowDown' });

      expect(handled).toBe(true);
      expect(tab).toHaveFocus();
      expect(onValueChange).not.toHaveBeenCalled();
    });
  });
});
