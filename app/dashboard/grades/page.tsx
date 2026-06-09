import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getGradesPageData } from '@/lib/actions/grades'
import { GradesClient } from './grades-client'

export const metadata: Metadata = { title: 'Mis Notas' }
export const revalidate = 0

export default async function GradesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const data = await getGradesPageData()

  return <GradesClient initialData={data} />
}
