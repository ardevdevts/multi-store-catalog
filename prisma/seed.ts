import 'dotenv/config'
import { faker } from '@faker-js/faker'

type PrismaModule = {
  PrismaClient: new (...args: any[]) => any
  Prisma: {
    Decimal: new (value: string | number) => any
  }
}

const loadPrismaModule = async (): Promise<PrismaModule> => {
  try {
    return (await import('../generated/prisma/client')) as PrismaModule
  } catch (error) {
    console.error(
      'Prisma Client not found at ./generated/prisma. Run `bunx prisma generate` or `bun run db:seed` to generate it.',
    )
    throw error
  }
}

let prisma: any = null
let Prisma: PrismaModule['Prisma'] | null = null

type CurrencySeed = {
  name: string
  code: string
  symbol: string
  symbolPosition: string
  decimalSeparator: string
  thousandsSeparator: string
  decimalPlaces: number
}

const ACTIVE_CURRENCY_CODES = new Set(['USD', 'EUR', 'CUP'])

type ThemeSeed = {
  name: string
  light: Record<string, string>
  dark: Record<string, string>
  fontId: string
}

const CONFIG = {
  users: 2,
  categories: 6,
  subcategoriesPerCategory: 3,
  productsPerSubcategory: 6,
  variantsPerProduct: { min: 1, max: 3 },
  productImages: { min: 1, max: 3 },
  variantImages: { min: 0, max: 2 },
  pricingCurrencies: { min: 2, max: 4 },
}

const CURRENCIES: CurrencySeed[] = [
  {
    name: 'Dólar estadounidense',
    code: 'USD',
    symbol: '$',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    decimalPlaces: 2,
  },
  {
    name: 'Euro',
    code: 'EUR',
    symbol: '€',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    decimalPlaces: 2,
  },
  {
    name: 'Libra esterlina',
    code: 'GBP',
    symbol: '£',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    decimalPlaces: 2,
  },
  {
    name: 'Dólar canadiense',
    code: 'CAD',
    symbol: '$',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    decimalPlaces: 2,
  },
  {
    name: 'Yen japonés',
    code: 'JPY',
    symbol: '¥',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    decimalPlaces: 0,
  },
  {
    name: 'Peso chileno',
    code: 'CLP',
    symbol: '$',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    decimalPlaces: 0,
  },
  {
    name: 'Peso mexicano',
    code: 'MXN',
    symbol: '$',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    decimalPlaces: 2,
  },
  {
    name: 'Real brasileño',
    code: 'BRL',
    symbol: 'R$',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    decimalPlaces: 2,
  },
  {
    name: 'Peso colombiano',
    code: 'COP',
    symbol: '$',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    decimalPlaces: 2,
  },
  {
    name: 'Peso uruguayo',
    code: 'UYU',
    symbol: '$U',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    decimalPlaces: 2,
  },
  {
    name: 'Peso cubano',
    code: 'CUP',
    symbol: '$',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    decimalPlaces: 2,
  },
  {
    name: 'Peso dominicano',
    code: 'DOP',
    symbol: 'RD$',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    decimalPlaces: 2,
  },
  {
    name: 'Sol peruano',
    code: 'PEN',
    symbol: 'S/',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    decimalPlaces: 2,
  },
  {
    name: 'Rupia india',
    code: 'INR',
    symbol: '₹',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    decimalPlaces: 2,
  },
  {
    name: 'Lira turca',
    code: 'TRY',
    symbol: '₺',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    decimalPlaces: 2,
  },
  {
    name: 'Rand sudafricano',
    code: 'ZAR',
    symbol: 'R',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    decimalPlaces: 2,
  },
]

const COLOR_OPTIONS = [
  { label: 'Black', value: 'black' },
  { label: 'White', value: 'white' },
  { label: 'Red', value: 'red' },
  { label: 'Blue', value: 'blue' },
  { label: 'Green', value: 'green' },
  { label: 'Amber', value: 'amber' },
  { label: 'Sand', value: 'sand' },
]

const SIZE_OPTIONS = [
  { label: 'XS', value: 'xs' },
  { label: 'S', value: 's' },
  { label: 'M', value: 'm' },
  { label: 'L', value: 'l' },
  { label: 'XL', value: 'xl' },
]

const MATERIAL_OPTIONS = [
  { label: 'Aluminum', value: 'aluminum' },
  { label: 'Cotton', value: 'cotton' },
  { label: 'Leather', value: 'leather' },
  { label: 'Glass', value: 'glass' },
  { label: 'Steel', value: 'steel' },
  { label: 'Wood', value: 'wood' },
]

const THEME_PRESETS: ThemeSeed[] = [
  {
    name: 'Coastal',
    fontId: 'lora',
    light: {
      background: 'oklch(98% 0.01 220)',
      foreground: 'oklch(20% 0.02 230)',
      primary: 'oklch(52% 0.14 240)',
      primaryForeground: 'oklch(98% 0 0)',
      accent: 'oklch(90% 0.05 200)',
      accentForeground: 'oklch(20% 0.02 230)',
      card: 'oklch(99% 0.005 220)',
      cardForeground: 'oklch(20% 0.02 230)',
      border: 'oklch(88% 0.02 220)',
      ring: 'oklch(60% 0.12 230)',
      radius: '0.75rem',
    },
    dark: {
      background: 'oklch(16% 0.02 230)',
      foreground: 'oklch(92% 0.01 220)',
      primary: 'oklch(75% 0.12 230)',
      primaryForeground: 'oklch(15% 0.02 230)',
      accent: 'oklch(28% 0.03 220)',
      accentForeground: 'oklch(92% 0.01 220)',
      card: 'oklch(20% 0.02 230)',
      cardForeground: 'oklch(92% 0.01 220)',
      border: 'oklch(30% 0.02 230)',
      ring: 'oklch(70% 0.1 230)',
      radius: '0.75rem',
    },
  },
  {
    name: 'Studio Noir',
    fontId: 'inter',
    light: {
      background: 'oklch(98% 0 0)',
      foreground: 'oklch(16% 0 0)',
      primary: 'oklch(28% 0.02 0)',
      primaryForeground: 'oklch(98% 0 0)',
      accent: 'oklch(92% 0 0)',
      accentForeground: 'oklch(18% 0 0)',
      card: 'oklch(99% 0 0)',
      cardForeground: 'oklch(18% 0 0)',
      border: 'oklch(90% 0 0)',
      ring: 'oklch(30% 0.02 0)',
      radius: '0.35rem',
    },
    dark: {
      background: 'oklch(10% 0 0)',
      foreground: 'oklch(92% 0 0)',
      primary: 'oklch(85% 0 0)',
      primaryForeground: 'oklch(10% 0 0)',
      accent: 'oklch(24% 0 0)',
      accentForeground: 'oklch(92% 0 0)',
      card: 'oklch(14% 0 0)',
      cardForeground: 'oklch(92% 0 0)',
      border: 'oklch(24% 0 0)',
      ring: 'oklch(80% 0 0)',
      radius: '0.35rem',
    },
  },
]

const BRAND_OPTIONS = [
  { label: 'Acme', value: 'acme' },
  { label: 'Nova', value: 'nova' },
  { label: 'Atlas', value: 'atlas' },
  { label: 'Solstice', value: 'solstice' },
  { label: 'Vertex', value: 'vertex' },
  { label: 'Pulse', value: 'pulse' },
]

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

const uniqueSlug = (value: string, used: Set<string>) => {
  const base = slugify(value)
  let slug = base || faker.string.alphanumeric({ length: 6, casing: 'lower' })
  while (used.has(slug)) {
    slug = `${base}-${faker.string.alphanumeric({ length: 4, casing: 'lower' })}`
  }
  used.add(slug)
  return slug
}

const randomInt = (min: number, max: number) =>
  faker.number.int({ min, max })

const randomFloat = (min: number, max: number, precision = 2) => {
  const factor = 10 ** precision
  return randomInt(Math.round(min * factor), Math.round(max * factor)) / factor
}

const pickMany = <T,>(items: T[], count: number) =>
  faker.helpers.arrayElements(items, count)

const imageUrl = (seed: string, width = 1200, height = 900) =>
  `https://picsum.photos/seed/${seed}/${width}/${height}`

const buildFilters = () => [
  {
    name: 'Brand',
    slug: 'brand',
    type: 'select',
    options: BRAND_OPTIONS,
  },
  {
    name: 'Color',
    slug: 'color',
    type: 'multiselect',
    options: COLOR_OPTIONS,
  },
  {
    name: 'Material',
    slug: 'material',
    type: 'select',
    options: MATERIAL_OPTIONS,
  },
  {
    name: 'Wireless',
    slug: 'wireless',
    type: 'boolean',
  },
  {
    name: 'Weight',
    slug: 'weight',
    type: 'range',
    unit: 'g',
  },
]

const buildSpecifications = () => ({
  sku: faker.string.alphanumeric({ length: 10, casing: 'upper' }),
  weight: randomInt(150, 5000),
  weightUnit: 'g',
  dimensions: {
    length: randomInt(10, 80),
    width: randomInt(10, 60),
    height: randomInt(5, 40),
    unit: 'cm',
  },
  volume: randomInt(250, 2000),
  volumeUnit: 'ml',
  unit: `${randomInt(1, 6)} pcs`,
})

const buildMetaData = (name: string) => ({
  seoTitle: name,
  seoDescription: faker.lorem.sentence(),
  warrantyMonths: randomInt(6, 36),
  origin: faker.location.country(),
})

const buildFilterValues = () => {
  const brand = faker.helpers.arrayElement(BRAND_OPTIONS)
  const color = faker.helpers.arrayElement(COLOR_OPTIONS)
  const material = faker.helpers.arrayElement(MATERIAL_OPTIONS)
  return [
    { slug: 'brand', value: brand.value },
    { slug: 'color', value: color.value },
    { slug: 'material', value: material.value },
    { slug: 'wireless', value: faker.datatype.boolean() },
  ]
}

const buildTags = () => {
  const tagWords = [
    faker.commerce.productAdjective(),
    faker.commerce.productMaterial(),
    faker.commerce.product(),
  ]
  return Array.from(new Set(tagWords.map((tag) => tag.toLowerCase())))
}

const buildPriceAmounts = (baseCents: number, multiplier: number) => {
  if (!Prisma) {
    throw new Error('Prisma Client not initialized.')
  }

  const adjusted = Math.max(199, Math.round(baseCents * multiplier))
  const saleChance = faker.number.int({ min: 1, max: 100 }) <= 35
  const saleCents = saleChance
    ? Math.max(99, adjusted - faker.number.int({ min: 50, max: 1500 }))
    : null

  return {
    amount: new Prisma.Decimal((adjusted / 100).toFixed(2)),
    saleAmount: saleCents
      ? new Prisma.Decimal((saleCents / 100).toFixed(2))
      : undefined,
  }
}

const buildTheme = (siteName: string) => {
  const preset = THEME_PRESETS[0]
  const logoSeed = slugify(siteName)

  return {
    light: preset.light,
    dark: preset.dark,
    fontId: preset.fontId,
    branding: {
      logoUrl: imageUrl(`logo-${logoSeed}`, 320, 200),
      logoAlt: `${siteName} logo`,
      logoWidth: 140,
      logoHeight: 140,
      faviconUrl: imageUrl(`favicon-${logoSeed}`, 64, 64),
      slogan: 'Calidad para todos los dias',
      contactEmail: faker.internet.email().toLowerCase(),
      contactPhone: faker.phone.number(),
      contactAddress: faker.location.streetAddress(),
      socialFacebook: `https://facebook.com/${logoSeed}`,
      socialInstagram: `https://instagram.com/${logoSeed}`,
      socialTwitter: `https://x.com/${logoSeed}`,
    },
  }
}

const buildContactSettings = () => ({
  contact: {
    email: faker.internet.email().toLowerCase(),
    phoneNumber: faker.phone.number(),
    address: `${faker.location.streetAddress()}, ${faker.location.city()}`,
  },
})

const getDatabaseLabel = () => {
  const url = process.env.DATABASE_URL
  if (!url) return 'DATABASE_URL not set'

  try {
    const parsed = new URL(url)
    const dbName = parsed.pathname.replace(/^\//, '') || '(no database)'
    const schema = parsed.searchParams.get('schema')
    return `${parsed.hostname}/${dbName}${schema ? ` (schema: ${schema})` : ''}`
  } catch {
    return 'DATABASE_URL is invalid'
  }
}

async function main() {
  const prismaModule = await loadPrismaModule()
  Prisma = prismaModule.Prisma
  prisma = new prismaModule.PrismaClient()

  console.log('Seeding database:', getDatabaseLabel())

  if (process.env.FAKER_SEED) {
    faker.seed(Number(process.env.FAKER_SEED))
  }

  const siteName = process.env.SEED_SITE_NAME || 'Una Ganga'

  await prisma.siteSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      name: siteName,
      description: faker.company.catchPhrase(),
      theme: buildTheme(siteName),
      settings: buildContactSettings(),
    },
  })

  const currencies = await Promise.all(
    CURRENCIES.map((currency) =>
      prisma.currency.upsert({
        where: { code: currency.code },
        update: {
          name: currency.name,
          symbol: currency.symbol,
          symbolPosition: currency.symbolPosition,
          decimalSeparator: currency.decimalSeparator,
          thousandsSeparator: currency.thousandsSeparator,
          decimalPlaces: currency.decimalPlaces,
          isActive: ACTIVE_CURRENCY_CODES.has(currency.code),
        },
        create: {
          ...currency,
          isActive: ACTIVE_CURRENCY_CODES.has(currency.code),
        },
      }),
    ),
  )

  for (let index = 0; index < CONFIG.users; index += 1) {
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()
    const email = faker.internet.email({ firstName, lastName }).toLowerCase()

    await prisma.user.create({
      data: {
        id: faker.string.uuid(),
        name: `${firstName} ${lastName}`,
        email,
        emailVerified: faker.datatype.boolean(),
        image: faker.image.avatar(),
        role: index === 0 ? 'ADMIN' : 'EDITOR',
      },
    })
  }

  const activeCurrencies = currencies.filter((currency: any) =>
    ACTIVE_CURRENCY_CODES.has(currency.code),
  )
  const pricingCurrencies = pickMany(
    activeCurrencies,
    randomInt(
      CONFIG.pricingCurrencies.min,
      Math.min(CONFIG.pricingCurrencies.max, activeCurrencies.length),
    ),
  )

  const categorySlugSet = new Set<string>()
  const categoryNameSet = new Set<string>()
  const subcategorySlugSet = new Set<string>()
  const subcategoryNameSet = new Set<string>()
  const productSlugSet = new Set<string>()

  for (let categoryIndex = 0; categoryIndex < CONFIG.categories; categoryIndex += 1) {
    let categoryName = `${faker.commerce.department()} ${faker.commerce.productAdjective()}`
    while (categoryNameSet.has(categoryName)) {
      categoryName = `${faker.commerce.department()} ${faker.commerce.productAdjective()}`
    }
    categoryNameSet.add(categoryName)

    const category = await prisma.category.create({
      data: {
        name: categoryName,
        slug: uniqueSlug(categoryName, categorySlugSet),
        description: faker.lorem.sentence(),
        icon: faker.helpers.arrayElement([
          'shopping-bag',
          'cpu',
          'sofa',
          'shirt',
          'camera',
          'sparkles',
        ]),
        isActive: true,
        filters: buildFilters(),
      },
    })

    for (
      let subcategoryIndex = 0;
      subcategoryIndex < CONFIG.subcategoriesPerCategory;
      subcategoryIndex += 1
    ) {
      let subcategoryName = `${faker.commerce.productAdjective()} ${faker.commerce.productMaterial()}`
      while (subcategoryNameSet.has(subcategoryName)) {
        subcategoryName = `${faker.commerce.productAdjective()} ${faker.commerce.productMaterial()}`
      }
      subcategoryNameSet.add(subcategoryName)

      const subcategory = await prisma.subcategory.create({
        data: {
          name: subcategoryName,
          slug: uniqueSlug(subcategoryName, subcategorySlugSet),
          description: faker.lorem.sentence(),
          isActive: true,
          filters: buildFilters(),
          categoryId: category.id,
        },
      })

      for (
        let productIndex = 0;
        productIndex < CONFIG.productsPerSubcategory;
        productIndex += 1
      ) {
        const productName = `${faker.commerce.productAdjective()} ${faker.commerce.product()}`
        const productSlug = uniqueSlug(productName, productSlugSet)

        const product = await prisma.product.create({
          data: {
            name: productName,
            slug: productSlug,
            description: faker.commerce.productDescription(),
            shortDescription: faker.lorem.sentence(),
            specifications: buildSpecifications(),
            filterValues: buildFilterValues(),
            tags: buildTags(),
            metaData: buildMetaData(productName),
            isActive: faker.datatype.boolean(),
            inStock: faker.datatype.boolean(),
            featured: faker.number.int({ min: 1, max: 100 }) <= 20,
            categoryId: category.id,
            subcategoryId: subcategory.id,
          },
        })

        const productImageCount = randomInt(
          CONFIG.productImages.min,
          CONFIG.productImages.max,
        )

        await prisma.media.createMany({
          data: Array.from({ length: productImageCount }).map((_, imageIndex) => ({
            alt: `${productName} image ${imageIndex + 1}`,
            url: imageUrl(`${product.id}-${imageIndex}`),
            productId: product.id,
          })),
        })

        const basePriceCents = randomInt(1500, 120000)

        for (const [currencyIndex, currency] of pricingCurrencies.entries()) {
          const multiplier = currencyIndex === 0 ? 1 : randomFloat(0.8, 1.3, 2)

          const { amount, saleAmount } = buildPriceAmounts(
            basePriceCents,
            multiplier,
          )

          await prisma.price.create({
            data: {
              amount,
              saleAmount,
              currencyId: currency.id,
              productId: product.id,
              isDefault: currencyIndex === 0,
              taxIncluded: faker.datatype.boolean(),
            },
          })
        }

        const variantCount = randomInt(
          CONFIG.variantsPerProduct.min,
          CONFIG.variantsPerProduct.max,
        )

        for (let variantIndex = 0; variantIndex < variantCount; variantIndex += 1) {
          const color = faker.helpers.arrayElement(COLOR_OPTIONS)
          const size = faker.helpers.arrayElement(SIZE_OPTIONS)
          const variantName = `${color.label} / ${size.label}`

          const variant = await prisma.productVariant.create({
            data: {
              name: variantName,
              sku: faker.string.alphanumeric({ length: 12, casing: 'upper' }),
              stock: randomInt(0, 80),
              attributes: {
                color: color.value,
                size: size.value,
              },
              isActive: faker.datatype.boolean(),
              image: imageUrl(`${product.id}-${variantIndex}-primary`, 800, 800),
              description: faker.lorem.sentences(2),
              shortDescription: faker.lorem.sentence(),
              specifications: buildSpecifications(),
              productId: product.id,
            },
          })

          const variantImageCount = randomInt(
            CONFIG.variantImages.min,
            CONFIG.variantImages.max,
          )

          if (variantImageCount > 0) {
            await prisma.media.createMany({
              data: Array.from({ length: variantImageCount }).map((_, imageIndex) => ({
                alt: `${productName} variant ${variantName} image ${imageIndex + 1}`,
                url: imageUrl(`${variant.id}-${imageIndex}`, 900, 900),
                productVariantId: variant.id,
              })),
            })
          }

          for (const [currencyIndex, currency] of pricingCurrencies.entries()) {
            const multiplier =
              currencyIndex === 0 ? 1 : randomFloat(0.8, 1.3, 2)

            const { amount, saleAmount } = buildPriceAmounts(
              Math.round(basePriceCents * 1.05),
              multiplier,
            )

            await prisma.price.create({
              data: {
                amount,
                saleAmount,
                currencyId: currency.id,
                productVariantId: variant.id,
                isDefault: currencyIndex === 0,
                taxIncluded: faker.datatype.boolean(),
              },
            })
          }
        }
      }
    }
  }

  const [
    userCount,
    categoryCount,
    subcategoryCount,
    productCount,
    variantCount,
    priceCount,
    mediaCount,
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.category.count(),
    prisma.subcategory.count(),
    prisma.product.count(),
    prisma.productVariant.count(),
    prisma.price.count(),
    prisma.media.count(),
  ])

  console.log('Seed summary:', {
    users: userCount,
    categories: categoryCount,
    subcategories: subcategoryCount,
    products: productCount,
    variants: variantCount,
    prices: priceCount,
    media: mediaCount,
  })
}

main()
  .then(() => {
    console.log('Seed complete.')
  })
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    if (prisma) {
      await prisma.$disconnect()
    }
  })