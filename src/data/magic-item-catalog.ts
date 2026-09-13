export interface MagicItemCatalogDocument {
  name: string
  source: string
  page?: number
  type: string
  rarity: string
  reqAttune?: boolean
  weight?: number
  ac?: number
  bonusAc?: string
  stealth?: boolean
  resist?: string[]
  weaponCategory?: string
  weapon?: string
  tier?: string
  bonusWeapon?: string
  dmg1?: string
  dmgType?: string
  property?: string[]
  entries: Array<string | { type?: string; name?: string; entries?: string[] }>
}

export interface MagicItemCatalogEntry {
  id: string
  kind: 'item'
  name: string
  source: string
  rarity: string
  typeLabel: string
  document: MagicItemCatalogDocument
  extensions?: {
    lore?: {
      background?: string
    }
  }
}

/** Session loot / homebrew catalog for DM grants. */
export const MAGIC_ITEM_CATALOG: MagicItemCatalogEntry[] = [
  {
    id: 'White Dragon Scale Mail|dmg',
    kind: 'item',
    name: 'Camisão de Escamas de Dragão Branco',
    source: 'DMG',
    rarity: 'muito rara',
    typeLabel: 'armadura média',
    document: {
      name: 'Camisão de Escamas de Dragão Branco',
      source: 'DMG',
      page: 165,
      type: 'armadura média',
      rarity: 'muito rara',
      reqAttune: true,
      weight: 45,
      ac: 14,
      bonusAc: '+1',
      stealth: true,
      resist: ['frio'],
      entries: [
        'O camisão de escamas de dragão é feito das escamas de um tipo de dragão. Às vezes, dragões coletam suas escamas descartadas e as presenteiam a humanoides. Outras vezes, caçadores cuidadosamente esfolam e preservam o couro de um dragão morto. Em ambos os casos, o camisão de escamas de dragão é altamente valorizado. Enquanto usa esta armadura, você recebe um bônus de +1 na CA, tem vantagem em salvaguardas contra a Presença Amedrontadora e as armas de sopro de dragões, e tem resistência a dano de frio.',
        'Além disso, você pode concentrar seus sentidos como uma ação para discernir magicamente a distância e a direção até o dragão branco mais próximo a até 30 milhas de você. Essa ação especial não pode ser usada novamente até o próximo amanhecer.',
      ],
    },
  },
  {
    id: 'homebrew_harshnag-godspurn-greataxe',
    kind: 'item',
    name: 'Machado Grande de Harshnag',
    source: 'HB',
    rarity: 'rara',
    typeLabel: 'arma marcial',
    document: {
      name: 'Machado Grande de Harshnag',
      source: 'HB',
      type: 'arma marcial',
      weaponCategory: 'martial',
      weapon: 'greataxe',
      rarity: 'rara',
      tier: 'major',
      reqAttune: true,
      weight: 325,
      bonusWeapon: '+1',
      dmg1: '2d12',
      dmgType: 'S',
      property: ['pesada', 'duas mãos'],
      entries: [
        {
          type: 'entries',
          entries: [
            'Você recebe um bônus de +1 nas jogadas de ataque e dano feitas com esta arma mágica. Ela é dimensionada para um gigante e pesa 147 kg. Em um acerto, causa 2d12 de dano cortante.',
          ],
        },
        {
          type: 'entries',
          name: 'Peso do Quebrador de Juramentos',
          entries: [
            'Se você for Médio ou menor, seu deslocamento é reduzido em 3 metros enquanto carregar ou empunhar esta arma, e você tem desvantagem nas jogadas de ataque feitas com ela. Você não pode ativar Desprezo Invernal.',
          ],
        },
        {
          type: 'entries',
          name: 'Fio do Matador de Parentes',
          entries: [
            'Quando você acerta com esta arma e você é um Gigante, o alvo sofre 1d12 de dano cortante extra se o alvo for um Gigante.',
          ],
        },
        {
          type: 'entries',
          name: 'Despertar do Gelo',
          entries: [
            'O machado emite luz plena em um raio de 6 metros e penumbra por mais 6 metros quando a temperatura ao redor cai abaixo de −17 °C. A luz não pode ser apagada nessas condições.',
          ],
        },
        {
          type: 'entries',
          name: 'Desprezo Invernal',
          entries: [
            'Enquanto estiver sintonizado com esta arma e você for um Gigante, você pode usar uma ação para exalar desprezo congelante em um cone de 4,5 metros. Cada criatura na área deve fazer um teste de resistência de Constituição CD 14, sofrendo 4d6 de dano de frio em uma falha, ou metade desse dano em um sucesso. Depois de usar esta propriedade, você não pode usá-la novamente até o próximo amanhecer.',
          ],
        },
      ],
    },
    extensions: {
      lore: {
        // Homebrew world (Hellingheim): inverted Harshnag / Gurt-axe pattern —
        // god-forged relic → villainous wielder → buried and lost.
        background:
          'O machado grande é um relicário do vale de Hellingheim, ao sul do Vale do Vulcão. Conta-se que foi empunhado pela primeira vez por Karontor, o deus da deformidade e do ressentimento entre os gigantes — mas ninguém sabe como chegou às mãos de Harshnag, o gigante da tempestade renegado.\n\nHarshnag foi uma figura terrível: expulso do ordning, assassino do próprio povo, mercenário que aceitava contratos contra outros gigantes e blasfemador que cuspia nos nomes dos deuses. Empunhou o machado até que Valgusk, lorde gigante da colina, o matou. Valgusk enterrou a arma sob o trono de Harshnag, e desde então ela se perdeu.',
      },
    },
  },
]
