import { describe, it, expect, vi } from 'vitest'
import { render, waitFor }           from '@testing-library/svelte'
import KekuleReaction                 from '../lib/KekuleReaction.svelte'

const { mockLoadKekule } = vi.hoisted(() => ({
  mockLoadKekule: vi.fn(() => Promise.resolve((window as any).Kekule)),
}))

vi.mock('../lib/loader.js', () => ({
  loadKekule:    mockLoadKekule,
  isKekuleReady: () => true,
}))

describe('KekuleReaction', () => {
  it('renders without crashing', () => {
    const { container } = render(KekuleReaction, { props: { reaction: 'CCO.CC(=O)O>>CC(=O)OCC.O' } })
    expect(container).toBeTruthy()
  })

  it('shows loading state initially', () => {
    const { container } = render(KekuleReaction, { props: { reaction: 'CCO>>CCO' } })
    const overlay = container.querySelector('.kekule-overlay')
    expect(overlay).toBeTruthy()
  })

  it('applies width and height styles', () => {
    const { container } = render(KekuleReaction, {
      props: { reaction: 'CCO>>CCO', width: '80%', height: '250px' },
    })
    const wrapper = container.querySelector('.kekule-reaction') as HTMLElement
    expect(wrapper.style.width).toBe('80%')
    expect(wrapper.style.height).toBe('250px')
  })

  it('applies extra class name', () => {
    const { container } = render(KekuleReaction, {
      props: { reaction: 'CCO>>CCO', class: 'my-reaction-class' },
    })
    expect(container.querySelector('.my-reaction-class')).toBeTruthy()
  })

  it('has correct aria label', () => {
    const { container } = render(KekuleReaction, { props: { reaction: 'CCO>>CCO' } })
    const wrapper = container.querySelector('.kekule-reaction')
    expect(wrapper?.getAttribute('aria-label')).toBe('Chemical reaction diagram')
  })

  it('calls onError for empty reaction after load', async () => {
    const onError = vi.fn()
    render(KekuleReaction, { props: { reaction: '', onError } })
    await waitFor(() => expect(onError).toHaveBeenCalled(), { timeout: 2000 })
  })

  it('calls onError when loader fails', async () => {
    mockLoadKekule.mockRejectedValueOnce(new Error('Failed to load'))

    const onError = vi.fn()
    render(KekuleReaction, { props: { reaction: 'CCO>>CCO', onError } })
    await waitFor(() => expect(onError).toHaveBeenCalled(), { timeout: 2000 })
  })
})
