import Database from 'better-sqlite3'

const tagItems: Record<string, string[]> = {
  cabeza: [
    'Casco cuero', 'Sombrero magico', 'Sombrero hechicero', 'Casco runico',
    'Sombrero maligno', 'Sombrero sacerdote', 'Capucha del druida', 'Casco hierro',
    'Casco de caballero', 'Casco valkiria', 'Casco enano', 'Casco tortuga',
    'Capucha del asesino', 'Casco del guerrero', 'Casco absorbente', 'casco dragon',
    'capucha elemental oscura', 'corona carmesi', 'corona de critias',
    'corona de hermos', 'corona de timaeus', 'mascara del ciclo',
  ],
  torso: [
    'Traje cuero ligero', 'Coraza de hojas', 'Coraza del bosque', 'Coraza floreciente',
    'Coraza del guerrero', 'Coraza de huesos', 'Coraza tortuga', 'Coraza absorbente',
    'Coraza mithril', 'Traje conchas', 'Vestido acorazado', 'vestido acorazado reforzado',
    'Coraza sagrada', 'Coraza celestial', 'Coraza sacrosanta', 'Coraza de obsidiana',
    'Coraza de ebano', 'Piel de obsidiana', 'Coraza de hierro', 'Coraza dorada',
    'Coraza de diamante', 'Coraza de picaro', 'Coraza sombria', 'Tunica',
    'Tunica aprendiz', 'Tunica de culto', 'Tunica corrupta', 'Tunica sacerdote',
    'Tunica del arzobispo', 'Tunica mago', 'Tunica archimagica', 'Tunica runica',
    'Coraza runica', 'Coraza canalizadora', 'Coraza canalizadora desatada',
    'coraza insecto sangriento', 'traje del devorador', 'tunica del devorador',
  ],
  brazos: [
    'Guantes cuero', 'Guanteletes de hierro', 'Guanteletes coral', 'Guanteletes obsidiana',
    'Guantes canalizadores', 'Guanteletes arcanos', 'Guantes filo bestial',
    'Guantes curandero', 'Guanteletes de sanacion', 'Guantes ladronzuelo',
    'Guantes del guerrero', 'guantes astrales',
  ],
  piernas: [
    'Botas cuero', 'Botas canalizadoras', 'Botas megacanalizadoras', 'Botas hechicero',
    'Botas hierro', 'Botas obsidiana', 'Botas de entrenamiento', 'Botas sagradas',
    'Botas protectoras', 'Botas rastrero', 'Botas elficas', 'botas tiburon',
  ],
  'Anillo de stats': [
    'anillo de la valkiria', 'anillo de la vida', 'anillo de precision', 'anillo ouroboros',
    'anillo hueso', 'anillo mana', 'anillo oro', 'anillo runico',
  ],
  'Anillo de utilidad': [
    'anillo estrella fugaz', 'anillo aguila dorada', 'anillo de la calamidad',
    'anillo de sacerdote', 'anillo del cuervo', 'anillo del gato', 'anillo elemental agua',
    'anillo elemental natura', 'anillo elemental viento', 'anillo floreciente',
    'anillo gelido', 'anillo grandeza lunar', 'anillo grandeza solar',
    'anillo omnielemental', 'anillo volcanico',
  ],
  cuello: [
    'colgante carmesi', 'colgante de ajo', 'colgante de fe', 'colgante de huesos',
    'colgante de oro', 'colgante electrico', 'colgante fusionado', 'colgante gelido',
    'colgante guerrero', 'colgante hechicero', 'colgante lazuli', 'colgante luz sagrada',
    'colgante natura', 'colgante santo', 'colgante trivalor', 'colgante volcanico',
  ],
  extra: [
    'aro potara', 'capa estelar', 'capa insectoide', 'arenas del tiempo', 'cronoataud',
    'Corazon de Mana', 'Corazon de Vlad', 'Corazon del Bosque', 'Corazon del Necromancer',
    'funda de arma', 'espadas del cosmos', 'maldicion del sombrero', 'manto de almas',
    'manto del necromancer', 'manto matriarca del bosque', 'mosca revividora',
    'putrefaccion radiante', 'tableta runica', 'Ultima Voluntad del Caballero',
    'Ojos de sucubo', 'hoja primogenita',
  ],
  'Arma a 1 mano': [
    'Azote de Mundos: Version Cetro', 'Cetro archimago', 'Cetro archimago oscuro',
    'Justicia de los Cielos', 'Mjolnir', 'bajo del dragon', 'ballesta dragon',
    'baston del bufon', 'boca del dragon', 'cetro de hermes', 'cetro dragon',
    'cetro lunar', 'cetro oscuro', 'cetro solar', 'chakram valkiria',
    'espada del yggdrasil', 'espada dragon', 'espada endless', 'estoque celestial',
    'estoque lujurioso', 'estrella del invierno', 'guadaña del bufon', 'hacha calabaza',
    'hacha calabaza liberada', 'lanza del necromancer', 'espada rota', 'espada gelida',
    'espada invernal', 'espada cero absoluto', 'espada energizada', 'espada angel',
    'cetro', 'cetro natural', 'cetro del bosque', 'cetro floreciente', 'cetro hoja dorada',
    'cetro avanzado', 'cetro rayo', 'cetro fenix', 'cetro experto',
    'cetro colibri cristalizado', 'cetro maestro', 'cetro marino', 'cetro de agua fluyente',
    'cetro maligno', 'cetro sangriento', 'ballesta de mano', 'ballesta de cristal',
    'ballesta arcana', 'ballesta fenix', 'ballesta doble', 'ballesta potenciada',
    'ballesta enana', 'ballesta cazadora', 'ballesta ejecutora', 'ballesta maldita',
    'hacha', 'hacha leñador', 'hacha de mano', 'hacha vikinga', 'hacha dios del trueno',
    'hacha maligna', 'hacha demoniaca', 'estaca', 'lanza corta', 'lanza oscura',
    'lanza oscura sobrecargada', 'lanza sangrienta', 'lanza sangrienta despertada',
    'martillo', 'martillo de combate', 'mazo del bosque', 'mazo de la vida', 'mazo sagrado',
    'mazo de la creacion', 'mazo de almas', 'mazo del reino de las sombras', 'pistola',
    'pistola rapida', 'pistola aumentada', 'pistola aumentada++', 'pistola ramus',
    'la demoledora', 'revolver', 'revolver de gran calibre', 'revolver cazador',
    'revolver de hueso', 'revolver maldito', 'revolver oscuro', 'tanto', 'chisa katana',
    'katana relampago', 'katana resplandor blanco', 'katana filo acuatico',
    'katana marea infinita', 'chakram', 'chakram dentado', 'chakram oscuro', 'chakram lunar',
    'chakram crescendum', 'chakram hielo', 'chakram imbuido', 'chakram aumentado',
    'chakram electrico', 'chakram esmeralda', 'chakram destello', 'chakram volcanico',
    'espada corta plata', 'espada larga plata', 'espada tiburon', 'espada megalodon',
    'espada llameante', 'espada cadena de lava', 'espada corta', 'espada larga',
    'espada sangrante', 'espada nigromante', 'espada sombria', 'espada oscura', 'espada piedra',
  ],
  'arma a 2 manos': [
    'espadon gelido', 'espadon invierno eterno', 'espada doble invierno', 'espadon sagrado',
    'espadon del cielo', 'rifle arcano', 'arco elfico', 'arco alto elfo', 'arco trishot',
    'arcoescudo', 'arco natura', 'arco sagrado', 'arco largo', 'arco vikingo',
    'arco pesado gelido', 'arco belial', 'arco oscuro', 'arco igneo', 'arco explosivo',
    'hacha de guerra', 'hacha de cristal', 'hacha del cosmos', 'hacha rubi',
    'hacha rubi perfecta', 'hacha holy', 'hacha angelical', 'hacha del paraiso',
    'hacha de fundicion', 'hacha fundida', 'hacha de magma', 'lanza de combate', 'lanza holy',
    'lanza angelical', 'mazo berserker', 'mazo obsidiana', 'mazo de ebano', 'mazo oscuro',
    'mazo demoniaco', 'mazo de fundicion', 'mazo carbonizado', 'mosquete', 'rifle',
    'rifle de alta precision', 'katana', 'katana armonica', 'katana ardiente', 'katana lunar',
    'katana viento del norte', 'katana solar', 'katana fuego del sur', 'cinturon blanco',
    'cinturon negro', 'cinturon rojo dan', 'cinturon torrencial', 'cinturon dragon',
    'nudillera', 'guanteletes de combate', 'vendas de combate', 'guantes de huesos',
    'guanteletes bestiales', 'guanteletes toxicos', 'guanteletes incendiados',
    'guanteletes de fundicion', 'chakram pesado', 'chakram antigüo', 'chakram divino',
    'chakram pesado oscuro', 'chakram arcano', 'mandoble', 'espadon cristal',
    'espadon cristal demoniaco', 'claymore', 'espadon demoniaco', 'espadon archidemoniaco',
    'mazo reloj de arena', 'Azote de Mundos', 'Dagas del Rey', 'Excalibur',
    'Guantes de Fenrir', 'Guantes de excavacion', 'Katana de sangre', 'Voluntad del bosque',
    'arco dark hole', 'espadon del caballero dragon', 'espadon dragon', 'espadon eclipse',
    'oscuridad alternante',
  ],
  'arma ligera': [
    'espada luz', 'arco corto', 'daga', 'daga de mana', 'daga imbuida', 'daga del erudito',
    'faga esmeralda', 'dagas de la naturaleza', 'daga nocturna', 'daga oscura',
    'daga necrotica', 'daga del fin', 'daga de plata', 'dagas punzantes', 'dagas letales',
    'daga argentea', 'daga carmesi', 'daga sangrienta', 'daga cristalizada', 'daga ruin',
    'daga maldita', 'guante filo oculto', 'daga del devorador',
  ],
  'escudo a 1 mano': [
    'escudo cuero', 'escudo magico', 'escudo aumentado', 'escudo maligno', 'escudo archimagico',
    'escudo madera', 'escudo hierro', 'escudo templario', 'escudo templario profanado',
    'escudo templario iluminado', 'escudo plata', 'escudo obsidiana', 'escudo diamante',
    'escudo demoniaco', 'escudo espinas', 'scudo podrido', 'escudo corazon de puas',
    'escudo de piel', 'escudo conchas', 'escudo marino', 'escudo antimagia',
    'escudo reflectante', 'escudo tortuga', 'escudo espartano', 'escudo dragon dorado',
    'escudo dark hole', 'escudo del devorador', 'escudo del valhalla', 'escudo escamas dragon',
  ],
  'escudo a 2 manos': [
    'escudo pesado', 'escudo impenetrable', 'escudo guardian de la torre', 'escudo lobo corrupto',
  ],
  'set completo': [
    'armadura de la torre', 'armadura dragon', 'armadura lider dorada',
    'armadura perfecta de hojas', 'traje cazador demonio', 'traje del cazador nocturno',
  ],
  pociones: [
    'pocion acuatica', 'pocion alada', 'pocion antimagia', 'pocion arrojadiza acido',
    'pocion arrojadiza bestia marina', 'pocion arrojadiza bomba slime',
    'pocion arrojadiza caos carmesi', 'pocion arrojadiza chispazo', 'pocion arrojadiza colmena',
    'pocion arrojadiza divina', 'pocion arrojadiza escarcha', 'pocion arrojadiza espacio',
    'pocion arrojadiza explosion arcana', 'pocion arrojadiza flema de araña',
    'pocion arrojadiza huracan', 'pocion arrojadiza incineradora', 'pocion arrojadiza maldita',
    'pocion arrojadiza muro instantaneo', 'pocion arrojadiza noche instantanea',
    'pocion arrojadiza raiz magica', 'pocion arrojadiza sombras', 'pocion arrojadiza tiempo',
    'pocion brumosa', 'pocion corazon latente', 'pocion de invisibilidad',
    'pocion de resucitacion', 'pocion del druida', 'pocion energizante',
    'pocion escamas dragon', 'pocion espectral', 'pocion fortificante', 'pocion furiosa',
    'pocion genesis vampirica', 'pocion invencible', 'pocion kvas de luna plateada',
    'pocion lujuriosa', 'pocion mana', 'pocion mana grande', 'pocion protectora',
    'pocion silenciosa', 'pocion vida', 'pocion vida grande',
  ],
}

export function applyTagReview(db: Database.Database): void {
  const hasReview = db.prepare("SELECT name FROM data_migration WHERE name = 'tag_review_v1'").get()
  if (hasReview) return

  const tx = db.transaction(() => {
    // Create tags and collect tagged item IDs
    const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)')
    const getTag = db.prepare('SELECT id FROM tags WHERE name = ?')
    const findItem = db.prepare('SELECT id FROM items WHERE LOWER(name) = LOWER(?)')
    const insertItemTag = db.prepare('INSERT OR IGNORE INTO item_tags (item_id, tag_id) VALUES (?, ?)')
    const deleteItemTags = db.prepare('DELETE FROM item_tags WHERE item_id = ?')

    const taggedItemIds = new Set<number>()
    let taggedCount = 0

    for (const [tagName, items] of Object.entries(tagItems)) {
      insertTag.run(tagName)
      const tagRow = getTag.get(tagName) as { id: number }

      for (const itemName of items) {
        const itemRow = findItem.get(itemName) as { id: number } | undefined
        if (!itemRow) continue

        // Remove old tag assignments for this item before assigning new one
        deleteItemTags.run(itemRow.id)
        insertItemTag.run(itemRow.id, tagRow.id)
        taggedItemIds.add(itemRow.id)
        taggedCount++
      }
    }

    // Apply pending item review updates
    db.prepare("UPDATE items SET attributes = 'defensa+1d10, ataque+2' WHERE LOWER(name) = LOWER('escudo maligno')").run()

    // Delete all items that are NOT in any tag list (only if they're not referenced by characters)
    // First remove character_items for untagged items
    const allItems = db.prepare('SELECT id, name FROM items').all() as { id: number; name: string }[]
    let deletedCount = 0

    for (const item of allItems) {
      if (!taggedItemIds.has(item.id)) {
        // This item has no tag — delete it cascading
        db.prepare('DELETE FROM character_items WHERE item_id = ?').run(item.id)
        db.prepare('DELETE FROM item_tags WHERE item_id = ?').run(item.id)
        db.prepare('DELETE FROM recipe_ingredients WHERE recipe_id IN (SELECT id FROM recipes WHERE product_item_id = ?)').run(item.id)
        db.prepare('DELETE FROM recipes WHERE product_item_id = ?').run(item.id)
        db.prepare('DELETE FROM character_materials WHERE item_id = ?').run(item.id)
        const result = db.prepare('DELETE FROM items WHERE id = ?').run(item.id)
        if (result.changes > 0) deletedCount++
      }
    }

    db.prepare("INSERT INTO data_migration (name, time_completed) VALUES ('tag_review_v1', strftime('%s','now') * 1000)").run()

    console.log(`Tag review applied: ${taggedCount} item tags assigned, ${deletedCount} untagged items deleted`)
  })
  tx()
}
