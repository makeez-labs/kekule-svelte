import { describe, it, expect, vi } from 'vitest'
import { render, waitFor }           from '@testing-library/svelte'
import KekuleViewer                   from '../lib/KekuleViewer.svelte'

const { mockLoadKekule } = vi.hoisted(() => ({
  mockLoadKekule: vi.fn(() => Promise.resolve((window as any).Kekule)),
}))

vi.mock('../lib/loader.js', () => ({
  loadKekule:    mockLoadKekule,
  isKekuleReady: () => true,
}))

describe('KekuleViewer', () => {
  it('renders without crashing', () => {
    const { container } = render(KekuleViewer, { props: { smiles: 'CCO' } })
    expect(container).toBeTruthy()
  })

  it('shows loading state initially', () => {
    const { container } = render(KekuleViewer, { props: { smiles: 'CCO' } })
    const overlay = container.querySelector('.kekule-overlay')
    expect(overlay).toBeTruthy()
  })

  it('applies width and height styles', () => {
    const { container } = render(KekuleViewer, {
      props: { smiles: 'CCO', width: '500px', height: '300px' },
    })
    const wrapper = container.querySelector('.kekule-viewer') as HTMLElement
    expect(wrapper.style.width).toBe('500px')
    expect(wrapper.style.height).toBe('300px')
  })

  it('applies extra class name', () => {
    const { container } = render(KekuleViewer, {
      props: { smiles: 'CCO', class: 'my-custom-class' },
    })
    expect(container.querySelector('.my-custom-class')).toBeTruthy()
  })

  it('calls onError for empty smiles after load', async () => {
    const onError = vi.fn()
    render(KekuleViewer, { props: { smiles: '', onError } })
    await waitFor(() => expect(onError).toHaveBeenCalled(), { timeout: 2000 })
  })

  it('calls onError when loader fails', async () => {
    mockLoadKekule.mockRejectedValueOnce(new Error('Failed to load'))

    const onError = vi.fn()
    render(KekuleViewer, { props: { smiles: 'CCO', onError } })
    await waitFor(() => expect(onError).toHaveBeenCalled(), { timeout: 2000 })
  })

  it('has correct aria label', () => {
    const { container } = render(KekuleViewer, { props: { smiles: 'CCO' } })
    const wrapper = container.querySelector('.kekule-viewer')
    expect(wrapper?.getAttribute('aria-label')).toBe('Molecular structure viewer')
  })

  it('has role="img" on wrapper', () => {
    const { container } = render(KekuleViewer, { props: { smiles: 'CCO' } })
    const wrapper = container.querySelector('.kekule-viewer')
    expect(wrapper?.getAttribute('role')).toBe('img')
  })

  it('passes through extra HTML attributes', () => {
    const { container } = render(KekuleViewer, {
      props: { smiles: 'CCO', 'data-testid': 'viewer-1' } as any,
    })
    const wrapper = container.querySelector('.kekule-viewer')
    expect(wrapper?.getAttribute('data-testid')).toBe('viewer-1')
  })

  it('shows error overlay for empty smiles', async () => {
    const { container } = render(KekuleViewer, { props: { smiles: '' } })
    await waitFor(() => {
      const errorEl = container.querySelector('.kekule-error-text')
      expect(errorEl).toBeTruthy()
    }, { timeout: 2000 })
  })

  it('accepts showToolbar prop', () => {
    const { container } = render(KekuleViewer, { props: { smiles: 'CCO', showToolbar: true } })
    expect(container.querySelector('.kekule-viewer')).toBeTruthy()
  })

  it('accepts interactive prop', () => {
    const { container } = render(KekuleViewer, { props: { smiles: 'CCO', interactive: true } })
    expect(container.querySelector('.kekule-viewer')).toBeTruthy()
  })
})
