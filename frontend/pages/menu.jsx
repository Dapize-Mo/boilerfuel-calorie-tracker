import Head from 'next/head';
import Layout from '../components/Layout';
import NutritionMenu from '../components/menu/NutritionMenu';
import { useMenuLayout } from '../utils/menuLayout';

// /menu — Nutrition-Facts menu browser for desktop & laptop.
// Layout preference (Ledger / Spread) is shared with Profile → Settings via
// useMenuLayout(); the in-page toggle and the settings control read/write the
// same persisted value.

export default function MenuPage() {
  const [layout, setLayout] = useMenuLayout();

  return (
    <>
      <Head>
        <title>Menu · BoilerFuel</title>
        <meta
          name="description"
          content="Browse today’s dining-court menu as a Nutrition Facts label — every percentage measured against the calories and macros you have left to eat today."
        />
      </Head>

      <Layout>
        <NutritionMenu layout={layout} onLayoutChange={setLayout} />
      </Layout>
    </>
  );
}
