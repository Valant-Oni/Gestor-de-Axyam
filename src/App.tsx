import { useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { HomePage } from '@/pages/HomePage'
import { CharactersPage } from '@/pages/CharactersPage'
import { EquipmentPage } from '@/pages/EquipmentPage'
import { RecipesPage } from '@/pages/RecipesPage'
import { DicePage } from '@/pages/DicePage'
import { useUserStore } from '@/stores/userStore'

function App() {
  const load = useUserStore((s) => s.load)

  useEffect(() => {
    load()
  }, [load])

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/personajes" element={<CharactersPage />} />
          <Route path="/equipamiento" element={<EquipmentPage />} />
          <Route path="/materiales" element={<RecipesPage />} />
          <Route path="/dados" element={<DicePage />} />
        </Routes>
      </Layout>
    </HashRouter>
  )
}

export default App
