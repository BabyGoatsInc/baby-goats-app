'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function DebugPage() {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [envVars, setEnvVars] = useState<Record<string, string>>({})
  const [tableData, setTableData] = useState<Record<string, number>>({})
  const [testResults, setTestResults] = useState<string[]>([])

  useEffect(() => {
    checkSupabaseConnection()
    checkEnvironmentVariables()
    checkTableCounts()
  }, [])

  const checkSupabaseConnection = async () => {
    try {
      const { data, error } = await supabase.from('debug_ping').select('*').limit(1)
      if (error) throw error
      setConnectionStatus('connected')
      addTestResult('✅ Supabase connection successful')
    } catch (error) {
      setConnectionStatus('error')
      addTestResult(`❌ Supabase connection failed: ${error}`)
    }
  }

  const checkEnvironmentVariables = () => {
    const vars = {
      'SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '❌ Missing',
      'SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '❌ Missing',
    }
    setEnvVars(vars)
  }

  const checkTableCounts = async () => {
    const tables = ['profiles', 'highlights', 'stats', 'challenges', 'challenge_completions', 'likes', 'debug_ping']
    const counts: Record<string, number> = {}

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (error) throw error
        counts[table] = count || 0
        addTestResult(`📊 Table '${table}': ${count || 0} rows`)
      } catch (error) {
        counts[table] = -1
        addTestResult(`❌ Table '${table}': Error - ${error}`)
      }
    }
    setTableData(counts)
  }

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }

  const insertSampleData = async () => {
    try {
      // Insert a debug ping
      const { error } = await supabase
        .from('debug_ping')
        .insert({ note: 'Debug test from Baby Goats app' })
      
      if (error) throw error
      addTestResult('✅ Sample data inserted successfully')
      checkTableCounts()
    } catch (error) {
      addTestResult(`❌ Failed to insert sample data: ${error}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Baby Goats Debug Panel</h1>
        
        {/* Connection Status */}
        <div className="baby-goats-card p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Supabase Connection Status</h2>
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
            connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
            connectionStatus === 'error' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {connectionStatus === 'connected' && '🟢'}
            {connectionStatus === 'error' && '🔴'}
            {connectionStatus === 'checking' && '🟡'}
            {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'error' ? 'Connection Failed' : 'Checking...'}
          </div>
        </div>

        {/* Environment Variables */}
        <div className="baby-goats-card p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Environment Variables</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(envVars).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="font-mono text-sm">{key}:</span>
                <span className={`text-sm ${value.includes('✓') ? 'text-green-600' : 'text-red-600'}`}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Database Tables */}
        <div className="baby-goats-card p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Database Table Counts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(tableData).map(([table, count]) => (
              <div key={table} className="border rounded-lg p-3">
                <div className="font-mono text-sm text-gray-600">{table}</div>
                <div className={`text-xl font-bold ${count === -1 ? 'text-red-600' : 'text-green-600'}`}>
                  {count === -1 ? 'Error' : count}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Test Actions */}
        <div className="baby-goats-card p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Test Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={insertSampleData}
              className="baby-goats-button baby-goats-button-primary"
            >
              Insert Sample Data
            </button>
            <button
              onClick={checkTableCounts}
              className="baby-goats-button baby-goats-button-secondary"
            >
              Refresh Table Counts
            </button>
          </div>
        </div>

        {/* Test Results Log */}
        <div className="baby-goats-card p-6">
          <h2 className="text-2xl font-semibold mb-4">Test Results Log</h2>
          <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500">No test results yet...</p>
            ) : (
              <ul className="space-y-1">
                {testResults.map((result, index) => (
                  <li key={index} className="text-sm font-mono">
                    {result}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}