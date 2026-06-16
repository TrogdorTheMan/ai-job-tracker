// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const SUITS = ['♠', '♥', '♦', '♣'] as const
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const
type Suit = (typeof SUITS)[number]
type Rank = (typeof RANKS)[number]
type Card = { rank: Rank; suit: Suit }
type Phase = 'idle' | 'playing' | 'result'
type Result = 'blackjack' | 'win' | 'lose' | 'push' | 'bust'

function makeDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) for (const rank of RANKS) deck.push({ rank, suit })
  const a = [...deck]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function total(hand: Card[]): number {
  let sum = 0, aces = 0
  for (const { rank } of hand) {
    if (rank === 'A') { aces++; sum += 11 }
    else if (['J', 'Q', 'K'].includes(rank)) sum += 10
    else sum += parseInt(rank)
  }
  while (sum > 21 && aces > 0) { sum -= 10; aces-- }
  return sum
}

function PlayingCard({ rank, suit, hidden }: { rank: Rank; suit: Suit; hidden?: boolean }) {
  if (hidden) {
    return (
      <div className="w-14 h-20 rounded-lg border-2 border-white/20 bg-blue-900 shadow-md flex items-center justify-center select-none shrink-0">
        <span className="text-white/30 text-2xl font-bold">?</span>
      </div>
    )
  }
  const isRed = suit === '♥' || suit === '♦'
  return (
    <div className={`w-14 h-20 rounded-lg border border-gray-200 bg-white shadow-md flex flex-col justify-between p-1.5 select-none text-xs font-bold leading-tight shrink-0 ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
      <div><div>{rank}</div><div>{suit}</div></div>
      <div className="self-end rotate-180"><div>{rank}</div><div>{suit}</div></div>
    </div>
  )
}

const RESULT_MSG: Record<Result, string> = {
  blackjack: '🎰 Blackjack!',
  win: '🤑 You win!',
  lose: '😬 Dealer wins.',
  push: '🤝 Push.',
  bust: '💥 Bust!',
}

export default function BlackjackGame({ onClose }: { onClose: () => void }) {
  const [deck, setDeck] = useState<Card[]>([])
  const [playerHand, setPlayerHand] = useState<Card[]>([])
  const [dealerHand, setDealerHand] = useState<Card[]>([])
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<Result | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [tally, setTally] = useState({ w: 0, l: 0, p: 0 })

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function deal() {
    const d = makeDeck()
    const p: Card[] = [d[0], d[2]]
    const dlr: Card[] = [d[1], d[3]]
    const rem = d.slice(4)
    setDeck(rem)
    setPlayerHand(p)
    setDealerHand(dlr)
    setRevealed(false)
    setResult(null)

    if (total(p) === 21) {
      setRevealed(true)
      const r: Result = total(dlr) === 21 ? 'push' : 'blackjack'
      setResult(r)
      setTally(t => r === 'push' ? { ...t, p: t.p + 1 } : { ...t, w: t.w + 1 })
      setPhase('result')
    } else {
      setPhase('playing')
    }
  }

  function hit() {
    const [card, ...rem] = deck
    const newHand = [...playerHand, card]
    setDeck(rem)
    setPlayerHand(newHand)
    if (total(newHand) > 21) {
      setRevealed(true)
      setResult('bust')
      setTally(t => ({ ...t, l: t.l + 1 }))
      setPhase('result')
    }
  }

  function stand() {
    let dlr = [...dealerHand]
    let rem = [...deck]
    while (total(dlr) < 17) {
      dlr = [...dlr, rem[0]]
      rem = rem.slice(1)
    }
    setDealerHand(dlr)
    setDeck(rem)
    setRevealed(true)

    const p = total(playerHand)
    const d = total(dlr)
    const r: Result = d > 21 || p > d ? 'win' : p < d ? 'lose' : 'push'
    setResult(r)
    setTally(t => ({
      w: r === 'win' ? t.w + 1 : t.w,
      l: r === 'lose' ? t.l + 1 : t.l,
      p: r === 'push' ? t.p + 1 : t.p,
    }))
    setPhase('result')
  }

  const playerTotal = playerHand.length > 0 ? total(playerHand) : null
  const dealerVisible = dealerHand.length > 0
    ? revealed ? total(dealerHand) : total([dealerHand[0]])
    : null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative rounded-2xl shadow-2xl p-6 w-full max-w-sm"
        style={{ background: '#1a5c2e', border: '2px solid #2d7a48' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-white font-bold text-lg leading-none">♠ Blackjack</h2>
            <p className="text-green-400/50 text-xs mt-1">Bite my shiny metal… cards.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs">
              <span className="text-green-300 font-medium">{tally.w}W</span>
              <span className="text-white/30"> · </span>
              <span className="text-red-300 font-medium">{tally.l}L</span>
              <span className="text-white/30"> · </span>
              <span className="text-yellow-300 font-medium">{tally.p}P</span>
            </span>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Dealer hand */}
        <div className="mb-4">
          <p className="text-green-300/60 text-xs mb-2">
            Dealer{dealerVisible !== null ? ` — ${dealerVisible}${!revealed && dealerHand.length > 1 ? '+?' : ''}` : ''}
          </p>
          <div className="flex gap-2 min-h-[5rem] flex-wrap">
            {dealerHand.map((card, i) => (
              <PlayingCard key={i} rank={card.rank} suit={card.suit} hidden={!revealed && i === 1} />
            ))}
          </div>
        </div>

        <div className="border-t border-green-700/40 my-4" />

        {/* Player hand */}
        <div className="mb-4">
          <p className="text-green-300/60 text-xs mb-2">
            You{playerTotal !== null ? ` — ${playerTotal}` : ''}
          </p>
          <div className="flex gap-2 min-h-[5rem] flex-wrap">
            {playerHand.map((card, i) => (
              <PlayingCard key={i} rank={card.rank} suit={card.suit} />
            ))}
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="text-center text-white font-bold text-xl py-2 mb-2">
            {RESULT_MSG[result]}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-center pt-1">
          {phase === 'idle' && (
            <Button
              onClick={deal}
              className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold border-0"
            >
              Deal
            </Button>
          )}
          {phase === 'playing' && (
            <>
              <Button
                onClick={hit}
                className="bg-white hover:bg-gray-100 text-black font-bold border-0"
              >
                Hit
              </Button>
              <Button
                onClick={stand}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 font-bold"
              >
                Stand
              </Button>
            </>
          )}
          {phase === 'result' && (
            <Button
              onClick={deal}
              className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold border-0"
            >
              Deal again
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
