import { useState } from 'react'
import { useDiceStore } from '@/stores/diceStore'
import { Button } from '@/components/ui/button'
import { Dices, History } from 'lucide-react'

const quickRolls = ['1d4', '1d6', '1d8', '1d10', '1d12', '1d13', '1d14', '1d15', '1d17', '1d20', '1d100', '1d3+2', '1d10+2']

export function DicePage() {
  const [expr, setExpr] = useState('1d20')
  const [result, setResult] = useState<{ result: number; breakdown: string; expr: string } | null>(null)
  const [rolling, setRolling] = useState(false)
  const { history, roll } = useDiceStore()

  const handleRoll = async (e?: string) => {
    const input = e || expr
    if (!input.trim()) return
    setRolling(true)
    try {
      const res = await window.electronAPI.dice.roll(input.trim())
      setResult(res)
      roll(input.trim())
    } catch (err) {
      console.error(err)
    }
    setRolling(false)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Dados</h1>
        <p className="text-muted-foreground text-sm">Tira dados para tus estadísticas y acciones</p>
      </div>

      <div className="border rounded-xl p-6 bg-card space-y-4">
        <div className="flex gap-2">
          <input value={expr} onChange={(e) => setExpr(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleRoll()}
            placeholder="Ej: 1d20, 2d6, 1d3+2"
            className="flex-1 px-3 py-2 rounded-lg border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring" />
          <Button onClick={() => handleRoll()} disabled={rolling}>
            <Dices className={`size-4 ${rolling ? 'animate-spin' : ''}`} />
            {rolling ? 'Tirando...' : 'Tirar'}
          </Button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {quickRolls.map((d) => (
            <button key={d} onClick={() => { setExpr(d); handleRoll(d) }}
              className="px-2.5 py-1 rounded-lg border bg-background text-xs font-mono hover:bg-accent transition-colors">
              {d}
            </button>
          ))}
        </div>

        {result && (
          <div className="text-center py-4">
            <p className="text-4xl font-bold">{result.result}</p>
            <p className="text-sm text-muted-foreground font-mono">{result.breakdown}</p>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2"><History className="size-4" /> Historial</h3>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {history.map((h, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-muted/50 text-sm">
                <span className="font-mono">{h.expr}</span>
                <span className="font-semibold">{h.result}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
