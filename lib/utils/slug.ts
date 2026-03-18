import { SupabaseClient } from '@supabase/supabase-js'

export function generateSlug(title: string, suffix?: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60)

  return suffix ? `${base}-${suffix}` : base
}

export async function generateUniqueSlug(title: string, supabase: SupabaseClient): Promise<string> {
  let slug = generateSlug(title)
  let counter = 1

  while (true) {
    const { data } = await supabase.from('projects').select('id').eq('slug', slug).single()

    if (!data) return slug

    slug = generateSlug(title, counter.toString())
    counter++
  }
}
