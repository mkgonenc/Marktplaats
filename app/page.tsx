'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://ggytnnctvjacdlwwlwzx.supabase.co',
  'sb_publishable_HuXPvZ9zAAHHkHgwIN3Csw_M3GsH_ey'
)

const CATEGORIES = ['Alle', 'Elektronica', 'Kleding', 'Meubels', 'Voertuigen', 'Sport', 'Tuin', 'Boeken', 'Overig']

export default function Home() {
  const [page, setPage] = useState('home')
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [ads, setAds] = useState<any[]>([])
  const [selectedAd, setSelectedAd] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('Alle')
  const [maxPrice, setMaxPrice] = useState('')
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [regForm, setRegForm] = useState({ name: '', email: '', password: '' })
  const [authMode, setAuthMode] = useState('login')
  const [authErr, setAuthErr] = useState('')
  const [newAd, setNewAd] = useState({ title: '', price: '', category: 'Elektronica', location: '', description: '', img: '' })
  const [adSuccess, setAdSuccess] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [msgInput, setMsgInput] = useState('')
  const [activeChat, setActiveChat] = useState<any>(null)
  const [pendingAds, setPendingAds] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setUser(data.session.user)
        fetchProfile(data.session.user.id)
      }
    })
    fetchAds()
  }, [])

  async function fetchProfile(uid: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single()
    setProfile(data)
  }

  async function fetchAds() {
    const { data } = await supabase.from('ads').select('*').eq('status', 'goedgekeurd').order('created_at', { ascending: false })
    setAds(data || [])
  }

  async function fetchPending() {
    const { data } = await supabase.from('ads').select('*').eq('status', 'wachtrij')
    setPendingAds(data || [])
  }

  async function fetchUsers() {
    const { data } = await supabase.from('profiles').select('*')
    setUsers(data || [])
  }

  async function fetchMessages(adId: number) {
    const { data } = await supabase.from('messages').select('*').eq('ad_id', adId).order('created_at')
    setMessages(data || [])
  }

  async function login() {
    setAuthErr('')
    const { error } = await supabase.auth.signInWithPassword({ email: loginForm.email, password: loginForm.password })
    if (error) { setAuthErr('Ongeldig e-mail of wachtwoord.'); return }
    const { data } = await supabase.auth.getSession()
    if (data.session) {
      setUser(data.session.user)
      fetchProfile(data.session.user.id)
      setPage('home')
    }
  }

  async function register() {
    setAuthErr('')
    if (!regForm.name || !regForm.email || !regForm.password) { setAuthErr('Vul alle velden in.'); return }
    const { data, error } = await supabase.auth.signUp({ email: regForm.email, password: regForm.password })
    if (error) { setAuthErr(error.message); return }
    if (data.user) {
      await supabase.from('profiles').insert({ id: data.user.id, name: regForm.name, role: 'user' })
      setUser(data.user)
      fetchProfile(data.user.id)
      setPage('home')
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null); setProfile(null); setPage('home')
  }

  async function submitAd() {
    if (!newAd.title || !newAd.price || !newAd.location) return
    await supabase.from('ads').insert({
      ...newAd, price: Number(newAd.price), status: 'wachtrij',
      seller_id: user.id, seller_name: profile?.name || user.email,
      img: newAd.img || `https://placehold.co/300x200/e6f1fb/185fa5?text=${encodeURIComponent(newAd.title.slice(0, 8))}`
    })
    setAdSuccess(true)
    setTimeout(() => { setAdSuccess(false); setNewAd({ title: '', price: '', category: 'Elektronica', location: '', description: '', img: '' }); setPage('home') }, 2000)
  }

  async function approveAd(id: number) {
    await supabase.from('ads').update({ status: 'goedgekeurd' }).eq('id', id)
    fetchPending()
  }

  async function rejectAd(id: number) {
    await supabase.from('ads').delete().eq('id', id)
    fetchPending()
  }

  async function sendMsg() {
    if (!msgInput.trim() || !activeChat) return
    await supabase.from('messages').insert({ ad_id: activeChat.id, sender_id: user.id, sender_name: profile?.name || user.email, content: msgInput })
    setMsgInput('')
    fetchMessages(activeChat.id)
  }

  const visibleAds = ads.filter(a => {
    if (catFilter !== 'Alle' && a.category !== catFilter) return false
    if (maxPrice && a.price > Number(maxPrice)) return false
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const s: any = { fontFamily: 'sans-serif', color: 'var(--color-text-primary, #1a1a1a)' }
  const inp: any = { width: '100%', boxSizing: 'border-box', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 }
  const btn: any = { padding: '8px 16px', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer', fontSize: 14, background: '#fff' }
  const btnP: any = { ...btn, background: '#185fa5', color: '#fff', border: 'none' }

  return (
    <div style={{ ...s, minHeight: '100vh', background: '#f5f5f5' }}>
      <nav style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '0 20px', display: 'flex', alignItems: 'center', gap: 12, height: 52 }}>
        <span onClick={() => setPage('home')} style={{ fontWeight: 600, fontSize: 18, cursor: 'pointer', color: '#185fa5' }}>Marktplaats</span>
        <div style={{ flex: 1 }} />
        {user && <button style={btn} onClick={() => setPage('place')}>+ Advertentie</button>}
        {profile?.role === 'admin' && <button style={btn} onClick={() => { setPage('admin'); fetchPending(); fetchUsers() }}>Admin {pendingAds.length > 0 && <span style={{ background: '#e24b4a', color: '#fff', borderRadius: '50%', fontSize: 11, padding: '1px 5px', marginLeft: 4 }}>{pendingAds.length}</span>}</button>}
        {user && <button style={btn} onClick={() => setPage('messages')}>Berichten</button>}
        {user ? <button style={btn} onClick={logout}>{profile?.name || user.email} – Uitloggen</button> : <button style={btnP} onClick={() => setPage('auth')}>Inloggen</button>}
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>

        {page === 'home' && <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <input style={{ ...inp, flex: 1, minWidth: 180 }} placeholder="Zoek advertenties..." value={search} onChange={e => setSearch(e.target.value)} />
            <input style={{ ...inp, width: 140 }} type="number" placeholder="Max prijs €" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {CATEGORIES.map(c => <button key={c} onClick={() => setCatFilter(c)} style={{ ...btn, background: catFilter === c ? '#185fa5' : '#fff', color: catFilter === c ? '#fff' : '#1a1a1a' }}>{c}</button>)}
          </div>
          {visibleAds.length === 0 && <p style={{ color: '#888' }}>Geen advertenties gevonden.</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {visibleAds.map(ad => (
              <div key={ad.id} onClick={() => { setSelectedAd(ad); setPage('detail') }} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}>
                <img src={ad.img} alt={ad.title} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                <div style={{ padding: 12 }}>
                  <p style={{ margin: 0, fontWeight: 600 }}>{ad.title}</p>
                  <p style={{ margin: '4px 0 0', color: '#185fa5', fontWeight: 600 }}>€{ad.price}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#888' }}>{ad.location} · {ad.category}</p>
                </div>
              </div>
            ))}
          </div>
        </>}

        {page === 'detail' && selectedAd && <>
          <button style={btn} onClick={() => setPage('home')}>← Terug</button>
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, marginTop: 16, overflow: 'hidden' }}>
            <img src={selectedAd.img} alt={selectedAd.title} style={{ width: '100%', maxHeight: 320, objectFit: 'cover' }} />
            <div style={{ padding: 20 }}>
              <h2 style={{ margin: 0 }}>{selectedAd.title}</h2>
              <p style={{ fontSize: 24, fontWeight: 600, color: '#185fa5', margin: '8px 0' }}>€{selectedAd.price}</p>
              <p style={{ color: '#888', fontSize: 13 }}>{selectedAd.location} · {selectedAd.category}</p>
              <p style={{ marginTop: 12 }}>{selectedAd.description}</p>
              <p style={{ fontSize: 13, color: '#888' }}>Verkoper: <strong>{selectedAd.seller_name}</strong></p>
              {user && user.id !== selectedAd.seller_id && (
                <button style={btnP} onClick={() => { setActiveChat(selectedAd); fetchMessages(selectedAd.id); setPage('messages') }}>Stuur bericht</button>
              )}
              {!user && <p style={{ fontSize: 13, color: '#888' }}>Log in om contact op te nemen.</p>}
            </div>
          </div>
        </>}

        {page === 'auth' && <>
          <div style={{ maxWidth: 380, margin: '0 auto', background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 28 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <button style={{ ...btn, flex: 1, background: authMode === 'login' ? '#185fa5' : '#fff', color: authMode === 'login' ? '#fff' : '#1a1a1a' }} onClick={() => setAuthMode('login')}>Inloggen</button>
              <button style={{ ...btn, flex: 1, background: authMode === 'register' ? '#185fa5' : '#fff', color: authMode === 'register' ? '#fff' : '#1a1a1a' }} onClick={() => setAuthMode('register')}>Registreren</button>
            </div>
            {authMode === 'login' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input style={inp} placeholder="E-mail" value={loginForm.email} onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))} />
                <input style={inp} type="password" placeholder="Wachtwoord" value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))} />
                {authErr && <p style={{ color: '#e24b4a', fontSize: 13, margin: 0 }}>{authErr}</p>}
                <button style={btnP} onClick={login}>Inloggen</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input style={inp} placeholder="Naam" value={regForm.name} onChange={e => setRegForm(p => ({ ...p, name: e.target.value }))} />
                <input style={inp} placeholder="E-mail" value={regForm.email} onChange={e => setRegForm(p => ({ ...p, email: e.target.value }))} />
                <input style={inp} type="password" placeholder="Wachtwoord" value={regForm.password} onChange={e => setRegForm(p => ({ ...p, password: e.target.value }))} />
                {authErr && <p style={{ color: '#e24b4a', fontSize: 13, margin: 0 }}>{authErr}</p>}
                <button style={btnP} onClick={register}>Account aanmaken</button>
              </div>
            )}
          </div>
        </>}

        {page === 'place' && <>
          <h2 style={{ fontWeight: 600, marginBottom: 16 }}>Advertentie plaatsen</h2>
          {adSuccess ? <div style={{ background: '#eaf3de', color: '#3b6d11', padding: 16, borderRadius: 8 }}>Advertentie ingediend! Wacht op goedkeuring.</div> : (
            <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 24, maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input style={inp} placeholder="Titel*" value={newAd.title} onChange={e => setNewAd(p => ({ ...p, title: e.target.value }))} />
              <input style={inp} type="number" placeholder="Prijs (€)*" value={newAd.price} onChange={e => setNewAd(p => ({ ...p, price: e.target.value }))} />
              <select style={inp} value={newAd.category} onChange={e => setNewAd(p => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.filter(c => c !== 'Alle').map(c => <option key={c}>{c}</option>)}
              </select>
              <input style={inp} placeholder="Locatie*" value={newAd.location} onChange={e => setNewAd(p => ({ ...p, location: e.target.value }))} />
              <textarea style={{ ...inp, height: 80, resize: 'vertical' }} placeholder="Beschrijving" value={newAd.description} onChange={e => setNewAd(p => ({ ...p, description: e.target.value }))} />
              <input style={inp} placeholder="Afbeelding URL (optioneel)" value={newAd.img} onChange={e => setNewAd(p => ({ ...p, img: e.target.value }))} />
              <button style={btnP} onClick={submitAd}>Indienen</button>
            </div>
          )}
        </>}

        {page === 'messages' && user && <>
          <h2 style={{ fontWeight: 600, marginBottom: 16 }}>Berichten</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>
            <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, overflow: 'hidden' }}>
              {activeChat && (
                <div style={{ padding: '12px 16px', background: '#e6f1fb', borderBottom: '1px solid #eee' }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>{activeChat.title}</p>
                </div>
              )}
              {!activeChat && <p style={{ padding: 12, fontSize: 13, color: '#888' }}>Geen chats.</p>}
            </div>
            <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, display: 'flex', flexDirection: 'column' }}>
              {activeChat ? <>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee', fontWeight: 600 }}>{activeChat.title}</div>
                <div style={{ flex: 1, padding: 16, minHeight: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {messages.map((m, i) => (
                    <div key={i} style={{ alignSelf: m.sender_id === user.id ? 'flex-end' : 'flex-start', background: m.sender_id === user.id ? '#185fa5' : '#f0f0f0', color: m.sender_id === user.id ? '#fff' : '#1a1a1a', padding: '8px 12px', borderRadius: 8, maxWidth: '70%', fontSize: 14 }}>
                      <p style={{ margin: 0 }}>{m.content}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, opacity: 0.7 }}>{m.sender_name}</p>
                    </div>
                  ))}
                  {messages.length === 0 && <p style={{ color: '#888', fontSize: 13 }}>Stuur je eerste bericht.</p>}
                </div>
                <div style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid #eee' }}>
                  <input style={{ ...inp, flex: 1 }} placeholder="Schrijf een bericht..." value={msgInput} onChange={e => setMsgInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMsg()} />
                  <button style={btnP} onClick={sendMsg}>Sturen</button>
                </div>
              </> : <div style={{ padding: 24, color: '#888' }}>Selecteer een gesprek.</div>}
            </div>
          </div>
        </>}

        {page === 'admin' && profile?.role === 'admin' && <>
          <h2 style={{ fontWeight: 600, marginBottom: 16 }}>Admin – Verificatie</h2>
          {pendingAds.length === 0 && <p style={{ color: '#888' }}>Geen advertenties in wachtrij.</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pendingAds.map(ad => (
              <div key={ad.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
                <img src={ad.img} alt={ad.title} style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 8 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 600 }}>{ad.title}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: '#888' }}>€{ad.price} · {ad.category} · {ad.location}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 13 }}>{ad.description}</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{ ...btn, color: '#3b6d11', border: '1px solid #639922' }} onClick={() => approveAd(ad.id)}>Goedkeuren</button>
                  <button style={{ ...btn, color: '#a32d2d', border: '1px solid #e24b4a' }} onClick={() => rejectAd(ad.id)}>Afwijzen</button>
                </div>
              </div>
            ))}
          </div>
          <h3 style={{ fontWeight: 600, marginTop: 32 }}>Gebruikers ({users.length})</h3>
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, overflow: 'hidden' }}>
            {users.map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid #eee' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e6f1fb', color: '#185fa5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 13 }}>{u.name?.[0] || '?'}</div>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{u.name}</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#888' }}>{u.role}</p>
                </div>
              </div>
            ))}
          </div>
        </>}

      </div>
    </div>
  )
}