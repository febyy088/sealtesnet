import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getObjectExplorerLink, downloadAndDecrypt } from '../src/utils';

describe('getObjectExplorerLink', () => {
  it('should return an anchor element with correct href', () => {
    const id = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const result = getObjectExplorerLink(id) as unknown as { type: string; props: Record<string, unknown> };

    expect(result.type).toBe('a');
    expect(result.props.href).toBe(`https://testnet.suivision.xyz/object/${id}`);
  });

  it('should open link in a new tab with security attributes', () => {
    const id = '0xabcdef1234567890';
    const result = getObjectExplorerLink(id) as unknown as { type: string; props: Record<string, unknown> };

    expect(result.props.target).toBe('_blank');
    expect(result.props.rel).toBe('noopener noreferrer');
  });

  it('should display truncated id (first 10 chars + ...)', () => {
    const id = '0x1234567890abcdef';
    const result = getObjectExplorerLink(id) as unknown as { type: string; props: Record<string, unknown>; };

    expect(result.props.children).toBe('0x12345678...');
  });

  it('should have underline text decoration style', () => {
    const id = '0xtest';
    const result = getObjectExplorerLink(id) as unknown as { type: string; props: Record<string, unknown> };

    expect(result.props.style).toEqual({ textDecoration: 'underline' });
  });

  it('should handle short ids correctly', () => {
    const id = '0x123';
    const result = getObjectExplorerLink(id) as unknown as { type: string; props: Record<string, unknown> };

    expect(result.props.children).toBe('0x123...');
  });

  it('should handle empty string id', () => {
    const id = '';
    const result = getObjectExplorerLink(id) as unknown as { type: string; props: Record<string, unknown> };

    expect(result.props.href).toBe('https://testnet.suivision.xyz/object/');
    expect(result.props.children).toBe('...');
  });
});

describe('downloadAndDecrypt', () => {
  let mockSetError: (error: string | null) => void;
  let mockSetDecryptedFileUrls: (urls: string[]) => void;
  let mockSetIsDialogOpen: (open: boolean) => void;
  let mockSetReloadKey: (updater: (prev: number) => number) => void;

  beforeEach(() => {
    mockSetError = vi.fn();
    mockSetDecryptedFileUrls = vi.fn();
    mockSetIsDialogOpen = vi.fn();
    mockSetReloadKey = vi.fn();
    vi.restoreAllMocks();
  });

  it('should set error when all blob downloads fail', async () => {
    (globalThis as unknown as { fetch: unknown }).fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const mockSessionKey = {} as Parameters<typeof downloadAndDecrypt>[1];
    const mockSuiClient = {} as Parameters<typeof downloadAndDecrypt>[2];
    const mockSealClient = {} as Parameters<typeof downloadAndDecrypt>[3];
    const mockMoveCallConstructor = vi.fn();

    await downloadAndDecrypt(
      ['blob1', 'blob2'],
      mockSessionKey,
      mockSuiClient,
      mockSealClient,
      mockMoveCallConstructor,
      mockSetError,
      mockSetDecryptedFileUrls,
      mockSetIsDialogOpen,
      mockSetReloadKey,
    );

    expect(mockSetError).toHaveBeenCalledWith(
      expect.stringContaining('Cannot retrieve files from this Walrus aggregator'),
    );
  });

  it('should set error when fetch returns non-ok response', async () => {
    (globalThis as unknown as { fetch: unknown }).fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });

    const mockSessionKey = {} as Parameters<typeof downloadAndDecrypt>[1];
    const mockSuiClient = {} as Parameters<typeof downloadAndDecrypt>[2];
    const mockSealClient = {} as Parameters<typeof downloadAndDecrypt>[3];
    const mockMoveCallConstructor = vi.fn();

    await downloadAndDecrypt(
      ['blob1'],
      mockSessionKey,
      mockSuiClient,
      mockSealClient,
      mockMoveCallConstructor,
      mockSetError,
      mockSetDecryptedFileUrls,
      mockSetIsDialogOpen,
      mockSetReloadKey,
    );

    expect(mockSetError).toHaveBeenCalledWith(
      expect.stringContaining('Cannot retrieve files from this Walrus aggregator'),
    );
  });

  it('should handle empty blobIds array', async () => {
    (globalThis as unknown as { fetch: unknown }).fetch = vi.fn();

    const mockSessionKey = {} as Parameters<typeof downloadAndDecrypt>[1];
    const mockSuiClient = {} as Parameters<typeof downloadAndDecrypt>[2];
    const mockSealClient = {} as Parameters<typeof downloadAndDecrypt>[3];
    const mockMoveCallConstructor = vi.fn();

    await downloadAndDecrypt(
      [],
      mockSessionKey,
      mockSuiClient,
      mockSealClient,
      mockMoveCallConstructor,
      mockSetError,
      mockSetDecryptedFileUrls,
      mockSetIsDialogOpen,
      mockSetReloadKey,
    );

    expect(mockSetError).toHaveBeenCalledWith(
      expect.stringContaining('Cannot retrieve files from this Walrus aggregator'),
    );
  });

  it('should use one of the configured aggregators in the fetch URL', async () => {
    const fetchCalls: string[] = [];
    (globalThis as unknown as { fetch: unknown }).fetch = vi.fn().mockImplementation((url: string) => {
      fetchCalls.push(url);
      return Promise.resolve({ ok: false });
    });

    const mockSessionKey = {} as Parameters<typeof downloadAndDecrypt>[1];
    const mockSuiClient = {} as Parameters<typeof downloadAndDecrypt>[2];
    const mockSealClient = {} as Parameters<typeof downloadAndDecrypt>[3];
    const mockMoveCallConstructor = vi.fn();

    await downloadAndDecrypt(
      ['testblob'],
      mockSessionKey,
      mockSuiClient,
      mockSealClient,
      mockMoveCallConstructor,
      mockSetError,
      mockSetDecryptedFileUrls,
      mockSetIsDialogOpen,
      mockSetReloadKey,
    );

    expect(fetchCalls.length).toBe(1);
    const url = fetchCalls[0];
    expect(url).toMatch(/\/(aggregator2|aggregator3)\/v1\/blobs\/testblob/);
  });
});
