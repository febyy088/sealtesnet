import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock the external dependencies
vi.mock('@mysten/dapp-kit', () => ({
  useSignAndExecuteTransaction: () => ({ mutate: vi.fn() }),
  useSuiClient: () => ({
    executeTransactionBlock: vi.fn(),
  }),
}));

vi.mock('@mysten/seal', () => {
  class MockSealClient {
    constructor() {}
  }
  return {
    SealClient: MockSealClient,
    getAllowlistedKeyServers: vi.fn().mockReturnValue([]),
  };
});

vi.mock('@mysten/sui/utils', () => ({
  fromHex: vi.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
  toHex: vi.fn().mockReturnValue('0x010203'),
}));

vi.mock('../src/networkConfig', () => ({
  useNetworkVariable: () => '0xtestpackageid',
}));

// Import after mocks
import { WalrusUpload } from '../src/EncryptAndUpload';

describe('WalrusUpload Component', () => {
  const defaultProps = {
    policyObject: '0xpolicy123',
    cap_id: '0xcap456',
    moduleName: 'allowlist',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the walrus service selector', () => {
    render(<WalrusUpload {...defaultProps} />);

    const select = screen.getByLabelText('Select Walrus service');
    expect(select).toBeInTheDocument();
  });

  it('should render service options', () => {
    render(<WalrusUpload {...defaultProps} />);

    expect(screen.getByText('staketab.org')).toBeInTheDocument();
    expect(screen.getByText('redundex.com')).toBeInTheDocument();
  });

  it('should render file input that only accepts images', () => {
    render(<WalrusUpload {...defaultProps} />);

    const fileInput = screen.getByLabelText('Choose image file to upload');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('accept', 'image/*');
  });

  it('should display file size limit message', () => {
    render(<WalrusUpload {...defaultProps} />);

    expect(
      screen.getByText('File size must be less than 10 MiB. Only image files are allowed.'),
    ).toBeInTheDocument();
  });

  it('should have encrypt button disabled when no file selected', () => {
    render(<WalrusUpload {...defaultProps} />);

    const button = screen.getByText('First step: Encrypt and upload to Walrus');
    expect(button).toBeDisabled();
  });

  it('should have publish button disabled when no upload info', () => {
    render(<WalrusUpload {...defaultProps} />);

    const button = screen.getByText('Second step: Associate file to Sui object');
    expect(button).toBeDisabled();
  });

  it('should not show upload spinner initially', () => {
    render(<WalrusUpload {...defaultProps} />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('should not show upload details initially', () => {
    render(<WalrusUpload {...defaultProps} />);

    expect(screen.queryByRole('region', { name: 'Upload details' })).not.toBeInTheDocument();
  });

  it('should allow service selection change', () => {
    render(<WalrusUpload {...defaultProps} />);

    const select = screen.getByLabelText('Select Walrus service') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'service3' } });
    expect(select.value).toBe('service3');
  });

  it('should alert when file exceeds 10 MiB', () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<WalrusUpload {...defaultProps} />);

    const fileInput = screen.getByLabelText('Choose image file to upload');
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.png', {
      type: 'image/png',
    });
    Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 });

    fireEvent.change(fileInput, { target: { files: [largeFile] } });
    expect(alertMock).toHaveBeenCalledWith('File size must be less than 10 MiB');
    alertMock.mockRestore();
  });

  it('should alert when file is not an image', () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<WalrusUpload {...defaultProps} />);

    const fileInput = screen.getByLabelText('Choose image file to upload');
    const textFile = new File(['hello'], 'test.txt', { type: 'text/plain' });

    fireEvent.change(fileInput, { target: { files: [textFile] } });
    expect(alertMock).toHaveBeenCalledWith('Only image files are allowed');
    alertMock.mockRestore();
  });
});
