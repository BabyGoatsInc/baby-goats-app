const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkSchema() {
    console.log('🔍 Checking database schema...')
    
    // Check profiles table
    console.log('\n📋 Profiles table:')
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)
    
    if (profilesError) {
        console.log('❌ Profiles error:', profilesError.message)
    } else if (profiles && profiles.length > 0) {
        console.log('✅ Profiles columns:', Object.keys(profiles[0]))
    } else {
        console.log('⚠️ Profiles table is empty')
    }
    
    // Check highlights table
    console.log('\n🎬 Highlights table:')
    const { data: highlights, error: highlightsError } = await supabase
        .from('highlights')
        .select('*')
        .limit(1)
    
    if (highlightsError) {
        console.log('❌ Highlights error:', highlightsError.message)
    } else if (highlights && highlights.length > 0) {
        console.log('✅ Highlights columns:', Object.keys(highlights[0]))
    } else {
        console.log('⚠️ Highlights table is empty')
    }
    
    // Check challenges table
    console.log('\n🏆 Challenges table:')
    const { data: challenges, error: challengesError } = await supabase
        .from('challenges')
        .select('*')
        .limit(1)
    
    if (challengesError) {
        console.log('❌ Challenges error:', challengesError.message)
    } else if (challenges && challenges.length > 0) {
        console.log('✅ Challenges columns:', Object.keys(challenges[0]))
    } else {
        console.log('⚠️ Challenges table is empty')
    }
    
    // Check stats table
    console.log('\n📊 Stats table:')
    const { data: stats, error: statsError } = await supabase
        .from('stats')
        .select('*')
        .limit(1)
    
    if (statsError) {
        console.log('❌ Stats error:', statsError.message)
    } else if (stats && stats.length > 0) {
        console.log('✅ Stats columns:', Object.keys(stats[0]))
    } else {
        console.log('⚠️ Stats table is empty')
    }
    
    // Check likes table
    console.log('\n❤️ Likes table:')
    const { data: likes, error: likesError } = await supabase
        .from('likes')
        .select('*')
        .limit(1)
    
    if (likesError) {
        console.log('❌ Likes error:', likesError.message)
    } else if (likes && likes.length > 0) {
        console.log('✅ Likes columns:', Object.keys(likes[0]))
    } else {
        console.log('⚠️ Likes table is empty')
    }
}

checkSchema().catch(console.error)