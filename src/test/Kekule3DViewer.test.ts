import { describe, it, expect, vi } from 'vitest'
import { render, waitFor }           from '@testing-library/svelte'
import Kekule3DViewer                 from '../lib/Kekule3DViewer.svelte'

const { mockLoadKekule } = vi.hoisted(() => ({
  mockLoadKekule: vi.fn(() => Promise.resolve((window as any).Kekule)),
}))

vi.mock('../lib/loader.js', () => ({
  loadKekule:    mockLoadKekule,
  isKekuleReady: () => true,
}))

describe('Kekule3DViewer', () => {
  it('renders without crashing', () => {
    const { container } = render(Kekule3DViewer, { props: { smiles: 'CCO' } })
    expect(container).toBeTruthy()
  })

  it('shows loading state initially', () => {
    const { container } = render(Kekule3DViewer, { props: { smiles: 'CCO' } })
    const overlay = container.querySelector('.kekule-overlay')
    expect(overlay).toBeTruthy()
  })

  it('applies width and height styles', () => {
    const { container } = render(Kekule3DViewer, {
      props: { smiles: 'CCO', width: '700px', height: '500px' },
    })
    const wrapper = container.querySelector('.kekule-3d-viewer') as HTMLElement
    expect(wrapper.style.width).toBe('700px')
    expect(wrapper.style.height).toBe('500px')
  })

  it('applies extra class name', () => {
    const { container } = render(Kekule3DViewer, {
      props: { smiles: 'CCO', class: 'my-3d-class' },
    })
    expect(container.querySelector('.my-3d-class')).toBeTruthy()
  })

  it('has correct aria label', () => {
    const { container } = render(Kekule3DViewer, { props: { smiles: 'CCO' } })
    const wrapper = container.querySelector('.kekule-3d-viewer')
    expect(wrapper?.getAttribute('aria-label')).toBe('3D molecular structure viewer')
  })

  it('renders from molBlock prop', () => {
    const { container } = render(Kekule3DViewer, { props: { molBlock: 'MOL block content' } })
    expect(container).toBeTruthy()
  })

  it('stays in loading state for empty smiles (no render triggered)', () => {
    const { container } = render(Kekule3DViewer, { props: { smiles: '' } })
    const overlay = container.querySelector('.kekule-overlay')
    expect(overlay).toBeTruthy()
  })

  it('calls onError when loader fails', async () => {
    mockLoadKekule.mockRejectedValueOnce(new Error('Failed to load'))

    const onError = vi.fn()
    render(Kekule3DViewer, { props: { smiles: 'CCO', onError } })
    await waitFor(() => expect(onError).toHaveBeenCalled(), { timeout: 2000 })
  })
})
