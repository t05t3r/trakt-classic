import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Toast from './Toast.svelte';

describe('component: Toast', () => {
  it('should show its message', () => {
    render(Toast, {
      props: { message: 'Could not save.', onDismiss: vi.fn() },
    });

    expect(screen.getByText('Could not save.')).toBeVisible();
  });

  it('should call onDismiss from the dismiss button', async () => {
    const onDismiss = vi.fn();
    render(Toast, { props: { message: 'Could not save.', onDismiss } });

    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
