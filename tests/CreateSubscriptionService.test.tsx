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

import { CreateService } from '../src/CreateSubscriptionService';

describe('CreateSubscriptionService Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the component with title', () => {
    render(<CreateService />);

    expect(screen.getByText('Admin View: Subscription')).toBeInTheDocument();
  });

  it('should render three input fields', () => {
    render(<CreateService />);

    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(3);
  });

  it('should render Create Service button', () => {
    render(<CreateService />);

    expect(screen.getByText('Create Service')).toBeInTheDocument();
  });

  it('should render View All button', () => {
    render(<CreateService />);

    expect(screen.getByText('View All Created Services')).toBeInTheDocument();
  });

  it('should alert when creating service with empty fields', () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<CreateService />);

    const button = screen.getByText('Create Service');
    fireEvent.click(button);

    expect(alertMock).toHaveBeenCalledWith('Please fill in all fields');
    alertMock.mockRestore();
  });

  it('should alert when price is 0', () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<CreateService />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '0' } });
    fireEvent.change(inputs[1], { target: { value: '10' } });
    fireEvent.change(inputs[2], { target: { value: 'Test' } });

    const button = screen.getByText('Create Service');
    fireEvent.click(button);

    expect(alertMock).toHaveBeenCalledWith('Please fill in all fields');
    alertMock.mockRestore();
  });

  it('should call signAndExecute when all fields are provided', () => {
    render(<CreateService />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '100' } });
    fireEvent.change(inputs[1], { target: { value: '10' } });
    fireEvent.change(inputs[2], { target: { value: 'Test Service' } });

    const button = screen.getByText('Create Service');
    fireEvent.click(button);

    expect(mockSignAndExecute).toHaveBeenCalled();
  });

  it('should navigate to view all on button click', () => {
    render(<CreateService />);

    const button = screen.getByText('View All Created Services');
    fireEvent.click(button);

    expect(mockNavigate).toHaveBeenCalledWith('/subscription-example/admin/services');
  });

  it('should alert when TTL is 0', () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<CreateService />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '100' } });
    fireEvent.change(inputs[1], { target: { value: '0' } });
    fireEvent.change(inputs[2], { target: { value: 'Test' } });

    const button = screen.getByText('Create Service');
    fireEvent.click(button);

    expect(alertMock).toHaveBeenCalledWith('Please fill in all fields');
    alertMock.mockRestore();
  });

  it('should alert when name is empty', () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<CreateService />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '100' } });
    fireEvent.change(inputs[1], { target: { value: '10' } });
    // name stays empty

    const button = screen.getByText('Create Service');
    fireEvent.click(button);

    expect(alertMock).toHaveBeenCalledWith('Please fill in all fields');
    alertMock.mockRestore();
  });
});
