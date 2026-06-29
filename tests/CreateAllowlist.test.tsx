import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock dependencies
const mockNavigate = vi.fn();
const mockSignAndExecute = vi.fn();

vi.mock('@mysten/dapp-kit', () => ({
  useSignAndExecuteTransaction: () => ({ mutate: mockSignAndExecute }),
  useSuiClient: () => ({
    executeTransactionBlock: vi.fn(),
  }),
}));

vi.mock('../src/networkConfig', () => ({
  useNetworkVariable: () => '0xtestpackageid',
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

import { CreateAllowlist } from '../src/CreateAllowlist';

describe('CreateAllowlist Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the component with title', () => {
    render(<CreateAllowlist />);

    expect(screen.getByText('Admin View: Allowlist')).toBeInTheDocument();
  });

  it('should render name input field', () => {
    render(<CreateAllowlist />);

    const input = screen.getByPlaceholderText('Allowlist Name');
    expect(input).toBeInTheDocument();
  });

  it('should render Create Allowlist button', () => {
    render(<CreateAllowlist />);

    expect(screen.getByText('Create Allowlist')).toBeInTheDocument();
  });

  it('should render View All button', () => {
    render(<CreateAllowlist />);

    expect(screen.getByText('View All Created Allowlists')).toBeInTheDocument();
  });

  it('should alert when creating allowlist with empty name', () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<CreateAllowlist />);

    const button = screen.getByText('Create Allowlist');
    fireEvent.click(button);

    expect(alertMock).toHaveBeenCalledWith('Please enter a name for the allowlist');
    alertMock.mockRestore();
  });

  it('should call signAndExecute when name is provided', () => {
    render(<CreateAllowlist />);

    const input = screen.getByPlaceholderText('Allowlist Name');
    fireEvent.change(input, { target: { value: 'My Test Allowlist' } });

    const button = screen.getByText('Create Allowlist');
    fireEvent.click(button);

    expect(mockSignAndExecute).toHaveBeenCalled();
  });

  it('should navigate to view all on button click', () => {
    render(<CreateAllowlist />);

    const button = screen.getByText('View All Created Allowlists');
    fireEvent.click(button);

    expect(mockNavigate).toHaveBeenCalledWith('/allowlist-example/admin/allowlists');
  });

  it('should update name state on input change', () => {
    render(<CreateAllowlist />);

    const input = screen.getByPlaceholderText('Allowlist Name') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Test Name' } });

    expect(input.value).toBe('Test Name');
  });
});
