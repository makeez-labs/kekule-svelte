import { describe, it, expect, vi } from 'vitest'
import { render, waitFor }           from '@testing-library/svelte'
import KekuleEditor                   from '../lib/KekuleEditor.svelte'

const { mockLoadKekule } = vi.hoisted(() => ({
  mockLoadKekule: vi.fn(() => Promise.resolve((window as any).Kekule)),
}))

vi.mock('../lib/loader.js', () => ({
  loadKekule:    mockLoadKekule,
  isKekuleReady: () => true,
}))

describe('KekuleEditor', () => {
  it('renders without crashing', () => {
    const { container } = render(KekuleEditor, { props: { smiles: 'CCO' } })
    expect(container).toBeTruthy()
  })

  it('shows loading state initially', () => {
    const { container } = render(KekuleEditor, { props: { smiles: 'CCO' } })
    const overlay = container.querySelector('.kekule-overlay')
    expect(overlay).toBeTruthy()
  })

  it('applies width and height styles', () => {
    const { container } = render(KekuleEditor, {
      props: { smiles: 'CCO', width: '600px', height: '500px' },
    })
    const wrapper = container.querySelector('.kekule-editor') as HTMLElement
    expect(wrapper.style.width).toBe('600px')
    expect(wrapper.style.height).toBe('500px')
  })

  it('applies extra class name', () => {
    const { container } = render(KekuleEditor, {
      props: { smiles: 'CCO', class: 'my-editor-class' },
    })
    expect(container.querySelector('.my-editor-class')).toBeTruthy()
  })

  it('calls onError when loader fails', async () => {
    mockLoadKekule.mockRejectedValueOnce(new Error('Failed to load'))

    const onError = vi.fn()
    render(KekuleEditor, { props: { smiles: 'CCO', onError } })
    await waitFor(() => expect(onError).toHaveBeenCalled(), { timeout: 2000 })
  })

  it('handles empty smiles', () => {
    const { container } = render(KekuleEditor, { props: { smiles: '' } })
    expect(container).toBeTruthy()
  })
})
