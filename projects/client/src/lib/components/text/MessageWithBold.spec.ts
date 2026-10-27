import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import MessageWithBold from './MessageWithBold.svelte';

describe('component: MessageWithBold', () => {
  it('should render a bold segment as a b element', () => {
    const { container } = render(MessageWithBold, {
      props: { message: 'If you like <b>FROM</b>, check out...' },
    });

    expect([...container.querySelectorAll('b')].map((b) => b.textContent))
      .toEqual(['FROM']);
    expect(container.textContent).toBe('If you like FROM, check out...');
  });

  it('should render each of several bold segments', () => {
    const { container } = render(MessageWithBold, {
      props: { message: '<b>Silo</b> and <b>Dark</b>' },
    });

    expect([...container.querySelectorAll('b')].map((b) => b.textContent))
      .toEqual(['Silo', 'Dark']);
    expect(container.textContent).toBe('Silo and Dark');
  });

  it('should render a message with no bold segment as text', () => {
    const { container } = render(MessageWithBold, {
      props: { message: 'Nothing bold here' },
    });

    expect(container.querySelector('b')).toBeNull();
    expect(container.textContent).toBe('Nothing bold here');
  });

  it('should follow a message that changes', async () => {
    const { container, rerender } = render(MessageWithBold, {
      props: { message: 'If you like <b>FROM</b>, check out...' },
    });

    await rerender({ message: 'If you like <b>Lost</b>, check out...' });

    expect(container.querySelector('b')?.textContent).toBe('Lost');
    expect(container.textContent).toBe('If you like Lost, check out...');
  });
});
