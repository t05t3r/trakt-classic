import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import LoginPage from './LoginPage.svelte';

describe('component: LoginPage', () => {
  it('should name the page in the document title', () => {
    render(LoginPage, { props: { returnTo: '/dashboard', error: null } });

    expect(document.title).toBe('Sign in · Trakt Classic');
  });
});
