'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://ggytnnctvjacdlwwlwzx.supabase.co',
  'sb_publishable_HuXPvZ9zAAHHkHgwIN3Csw_M3GsH_ey'
)

const CATEGORIES = ['Alle', 'Elektronica', 'Kleding', 'Meubels', 'Voertuigen', 'Sport', 'Tuin', 'Boeken', 'Overig']
const REPORT_REASONS = ['Oplichting', 'Verboden product', 'Misleidende beschrijving', 'Spam', 'Andere reden']
const BANNED_WORDS = ['drugs', 'wapen', 'nep', 'fake', 'gestolen', 'illegaal']

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
  const [regForm, setRegForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [authMode, setAuthMode] = useState('login')
  const [authErr, setAuthErr] = useState('')
  const [newAd, setNewAd] = useState({ title: '', price: '', category: 'Elektronica', location: '', description: '' })
  const [adSuccess, setAdSuccess] = useState(false)
  const [imgFile, setImgFile] = useState<File | null>(null)
  const [imgUploading, setImgUploading] = useState(false)
  const [adWarning, setAdWarning] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const [msgInput, setMsgInput] = useState('')
  const [activeChat, setActiveChat] = useState<any>(null)
  const [pendingAds, setPendingAds] = useState<any[]>([])
  const [pendingIds, setPendingIds] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportSuccess, setReportSuccess] = useState(false)
  const [reviews, setReviews] = useState<any[]>([])
  const [showReview, setShowReview] = useState(false)
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' })
  const [reviewSuccess, setReviewSuccess] = useState(false)
  const [aiCheck, setAiCheck] = useState<any>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [verifyEmailSent, setVerifyEmailSent] = useState(false)
  const [favorites, setFavorites] = useState<number[]>([])
  const [idStep1, setIdStep1] = useState<File | null>(null)
  const [idStep2, setIdStep2] = useState<File | null>(null)
  const [idStep3, setIdStep3] = useState<File | null>(null)
  const [idUploading, setIdUploading] = useState(false)
  const [idSuccess, setIdSuccess] = useState(false)
  const [idError, setIdError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) { setUser(data.session.user); fetchProfile(data.session.user.id) }
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
    const { data: ids } = await supabase.from('profiles').select('*').eq('id_status', 'ingediend')
    setPendingIds(ids || [])
  }

  async function fetchUsers() {
    const { data } = await supabase.from('profiles').select('*')
    setUsers(data || [])
  }

  async function fetchReports() {
    const { data } = await supabase.from('reports').select('*')
    setReports(data || [])
  }

  async function fetchMessages(adId: number) {
    const { data } = await supabase.from('messages').select('*').eq('ad_id', adId).order('created_at')
    setMessages(data || [])
  }

  async function fetchReviews(sellerId: string) {
    const { data } = await supabase.from('reviews').select('*').eq('seller_id', sellerId).order('created_at', { ascending: false })
    setReviews(data || [])
  }

  async function login() {
    setAuthErr('')
    const { error } = await supabase.auth.signInWithPassword({ email: loginForm.email, password: loginForm.password })
    if (error) { setAuthErr('Ongeldig e-mail of wachtwoord.'); return }
    const { data } = await supabase.auth.getSession()
    if (data.session) { setUser(data.session.user); fetchProfile(data.session.user.id); setPage('home') }
  }

  async function register() {
    setAuthErr('')
    if (!regForm.name || !regForm.email || !regForm.password) { setAuthErr('Vul alle velden in.'); return }
    if (regForm.password.length < 6) { setAuthErr('Wachtwoord moet minstens 6 tekens zijn.'); return }
    const { data, error } = await supabase.auth.signUp({ email: regForm.email, password: regForm.password })
    if (error) { setAuthErr(error.message); return }
    if (data.user) {
      await supabase.from('profiles').insert({ id: data.user.id, name: regForm.name, role: 'user', phone: regForm.phone, id_status: 'niet_ingediend' })
      setVerifyEmailSent(true)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null); setProfile(null); setPage('home')
  }

  async function uploadFile(file: File, prefix: string): Promise<string | null> {
    const ext = file.name.split('.').pop()
    const path = `${prefix}-${user.id}-${Date.now()}.${ext}`
    const { data } = await supabase.storage.from('advertenties').upload(path, file)
    if (!data) return null
    const { data: urlData } = supabase.storage.from('advertenties').getPublicUrl(path)
    return urlData.publicUrl
  }

  async function submitIdVerification() {
    if (!idStep1 || !idStep2 || !idStep3) { setIdError('Upload alle 3 de foto\'s om door te gaan.'); return }
    setIdError('')
    setIdUploading(true)
    const url1 = await uploadFile(idStep1, 'id-doc')
    const url2 = await uploadFile(idStep2, 'id-selfie')
    const url3 = await uploadFile(idStep3, 'id-proof')
    if (!url1 || !url2 || !url3) { setIdError('Upload mislukt. Probeer opnieuw.'); setIdUploading(false); return }
    await supabase.from('profiles').update({ id_step1: url1, id_step2: url2, id_step3: url3, id_status: 'ingediend' }).eq('id', user.id)
    fetchProfile(user.id)
    setIdSuccess(true)
    setIdUploading(false)
  }

  function checkBannedWords(text: string) {
    return BANNED_WORDS.filter(w => text.toLowerCase().includes(w))
  }

  async function submitAd() {
    if (!newAd.title || !newAd.price || !newAd.location) return
    if (profile?.id_status !== 'goedgekeurd') {
      setAdWarning('Je moet eerst je identiteit verifiëren voor je een advertentie kan plaatsen. Ga naar Mijn Profiel.')
      return
    }
    const banned = checkBannedWords(newAd.title + ' ' + newAd.description)
    if (banned.length > 0) { setAdWarning(`Verboden woorden gevonden: ${banned.join(', ')}`); return }
    setAdWarning('')
    setImgUploading(true)
    let imgUrl = `https://placehold.co/300x200/e6f1fb/185fa5?text=${encodeURIComponent(newAd.title.slice(0, 8))}`
    if (imgFile) {
      const url = await uploadFile(imgFile, 'ad')
      if (url) imgUrl = url
    }
    setImgUploading(false)
    await supabase.from('ads').insert({ ...newAd, price: Number(newAd.price), status: 'wachtrij', seller_id: user.id, seller_name: profile?.name || user.email, img: imgUrl })
    setAdSuccess(true)
    setTimeout(() => { setAdSuccess(false); setNewAd({ title: '', price: '', category: 'Elektronica', location: '', description: '' }); setImgFile(null); setPage('home') }, 2500)
  }
async function deleteAd(id: number) {
  if (!confirm('Weet je zeker dat je deze advertentie wilt verwijderen?')) return
  await supabase.from('ads').delete().eq('id', id)
  fetchAds()
  setPage('home')
}
  async function approveAd(id: number) {
    await supabase.from('ads').update({ status: 'goedgekeurd' }).eq('id', id); fetchPending()
  }

  async function rejectAd(id: number) {
    await supabase.from('ads').delete().eq('id', id); fetchPending()
  }

  async function approveId(userId: string) {
    await supabase.from('profiles').update({ id_verified: true, id_status: 'goedgekeurd' }).eq('id', userId); fetchPending()
  }

  async function rejectId(userId: string) {
    await supabase.from('profiles').update({ id_status: 'afgewezen', id_step1: null, id_step2: null, id_step3: null }).eq('id', userId); fetchPending()
  }
async function deleteAd(id: number) {
  if (!confirm('Weet je zeker dat je deze advertentie wilt verwijderen?')) return
  await supabase.from('ads').delete().eq('id', id)
  fetchAds()
  setPage('home')
}

  async function sendMsg() {
    if (!msgInput.trim() || !activeChat) return
    await supabase.from('messages').insert({ ad_id: activeChat.id, sender_id: user.id, sender_name: profile?.name || user.email, content: msgInput })
    setMsgInput(''); fetchMessages(activeChat.id)
  }

  async function submitReport() {
    if (!reportReason || !selectedAd) return
    await supabase.from('reports').insert({ ad_id: selectedAd.id, reporter_id: user.id, reason: reportReason })
    setReportSuccess(true); setShowReport(false)
    setTimeout(() => setReportSuccess(false), 3000)
  }

  async function submitReview() {
    if (!selectedAd || !newReview.comment) return
    await supabase.from('reviews').insert({ seller_id: selectedAd.seller_id, reviewer_id: user.id, reviewer_name: profile?.name || user.email, rating: newReview.rating, comment: newReview.comment })
    setReviewSuccess(true); setShowReview(false); fetchReviews(selectedAd.seller_id)
    setTimeout(() => setReviewSuccess(false), 3000)
  }

  async function checkAdWithAI(ad: any) {
    setAiLoading(true); setAiCheck(null)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 300,
          messages: [{ role: 'user', content: `Beoordeel deze marktplaats advertentie op veiligheid in het Nederlands. Geef: 1) Veilig of Verdacht, 2) Reden, 3) Aanbeveling. Titel: ${ad.title}, Prijs: €${ad.price}, Beschrijving: ${ad.description}` }]
        })
      })
      const data = await res.json()
      setAiCheck(data.content?.[0]?.text || 'Geen beoordeling.')
    } catch { setAiCheck('AI niet beschikbaar.') }
    setAiLoading(false)
  }

  function toggleFavorite(id: number) {
    setFavorites(p => p.includes(id) ? p.filter(f => f !== id) : [...p, id])
  }

  const visibleAds = ads.filter(a => {
    if (catFilter !== 'Alle' && a.category !== catFilter) return false
    if (maxPrice && a.price > Number(maxPrice)) return false
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null
  const inp: any = { width: '100%', boxSizing: 'border-box', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, background: '#fff', color: '#1a1a1a' }
  const btn: any = { padding: '8px 16px', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer', fontSize: 14, background: '#fff', color: '#1a1a1a' }
  const btnP: any = { ...btn, background: '#185fa5', color: '#fff', border: 'none' }
  const btnR: any = { ...btn, background: '#e24b4a', color: '#fff', border: 'none' }
  const btnG: any = { ...btn, background: '#3b6d11', color: '#fff', border: 'none' }

  const idStatusBadge = () => {
    if (!profile) return null
    if (profile.id_status === 'goedgekeurd') return <span style={{ background: '#eaf3de', color: '#3b6d11', fontSize: 11, padding: '2px 8px', borderRadius: 12 }}>✓ ID Geverifieerd</span>
    if (profile.id_status === 'ingediend') return <span style={{ background: '#faeeda', color: '#854f0b', fontSize: 11, padding: '2px 8px', borderRadius: 12 }}>⏳ In behandeling</span>
    if (profile.id_status === 'afgewezen') return <span style={{ background: '#fff5f5', color: '#a32d2d', fontSize: 11, padding: '2px 8px', borderRadius: 12 }}>✗ Afgekeurd</span>
    return <span style={{ background: '#f0f0f0', color: '#888', fontSize: 11, padding: '2px 8px', borderRadius: 12 }}>Niet geverifieerd</span>
  }

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#f5f5f5', color: '#1a1a1a' }}>
      <nav style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '0 20px', display: 'flex', alignItems: 'center', gap: 12, height: 52, flexWrap: 'wrap' }}>
        <span onClick={() => setPage('home')} style={{ fontWeight: 600, fontSize: 18, cursor: 'pointer', color: '#185fa5' }}>Marktplaats</span>
        <div style={{ flex: 1 }} />
        {user && <button style={btn} onClick={() => setPage('place')}>+ Advertentie</button>}
        {user && <button style={btn} onClick={() => setPage('profile')}>Mijn Profiel</button>}
        {profile?.role === 'admin' && (
          <button style={btn} onClick={() => { setPage('admin'); fetchPending(); fetchUsers(); fetchReports() }}>
            Admin {(pendingAds.length + pendingIds.length) > 0 && <span style={{ background: '#e24b4a', color: '#fff', borderRadius: '50%', fontSize: 11, padding: '1px 5px', marginLeft: 4 }}>{pendingAds.length + pendingIds.length}</span>}
          </button>
        )}
        {user && <button style={btn} onClick={() => setPage('messages')}>Berichten</button>}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {idStatusBadge()}
            <button style={btn} onClick={logout}>{profile?.name || user.email} – Uitloggen</button>
          </div>
        ) : <button style={btnP} onClick={() => setPage('auth')}>Inloggen</button>}
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>

        {/* HOME */}
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
              <div key={ad.id} onClick={() => { setSelectedAd(ad); fetchReviews(ad.seller_id); setPage('detail') }} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}>
                <img src={ad.img} alt={ad.title} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                <div style={{ padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>{ad.title}</p>
                    <span onClick={e => { e.stopPropagation(); toggleFavorite(ad.id) }} style={{ cursor: 'pointer', fontSize: 18 }}>{favorites.includes(ad.id) ? '❤️' : '🤍'}</span>
                  </div>
                  <p style={{ margin: '4px 0 0', color: '#185fa5', fontWeight: 600 }}>€{ad.price}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#888' }}>{ad.location} · {ad.category}</p>
                </div>
              </div>
            ))}
          </div>
        </>}

        {/* DETAIL */}
        {page === 'detail' && selectedAd && <>
          <button style={btn} onClick={() => setPage('home')}>← Terug</button>
          {reportSuccess && <div style={{ background: '#eaf3de', color: '#3b6d11', padding: 12, borderRadius: 8, marginTop: 12 }}>Rapport ingediend!</div>}
          {reviewSuccess && <div style={{ background: '#eaf3de', color: '#3b6d11', padding: 12, borderRadius: 8, marginTop: 12 }}>Review geplaatst!</div>}
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, marginTop: 16, overflow: 'hidden' }}>
            <img src={selectedAd.img} alt={selectedAd.title} style={{ width: '100%', maxHeight: 320, objectFit: 'cover' }} />
            <div style={{ padding: 20 }}>
              <h2 style={{ margin: 0 }}>{selectedAd.title}</h2>
              <p style={{ fontSize: 24, fontWeight: 600, color: '#185fa5', margin: '8px 0' }}>€{selectedAd.price}</p>
              <p style={{ color: '#888', fontSize: 13 }}>{selectedAd.location} · {selectedAd.category}</p>
              <p style={{ marginTop: 12 }}>{selectedAd.description}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
                <p style={{ margin: 0, fontSize: 13, color: '#888' }}>Verkoper: <strong>{selectedAd.seller_name}</strong></p>
                {avgRating && <span style={{ background: '#faeeda', color: '#854f0b', fontSize: 12, padding: '2px 8px', borderRadius: 12 }}>⭐ {avgRating} ({reviews.length})</span>}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                {user && user.id !== selectedAd.seller_id && <>
                  <button style={btnP} onClick={() => { setActiveChat(selectedAd); fetchMessages(selectedAd.id); setPage('messages') }}>Stuur bericht</button>
                  <button style={{ ...btn, color: '#854f0b', border: '1px solid #ef9f27' }} onClick={() => setShowReview(true)}>Review</button>
                  <button style={btnR} onClick={() => setShowReport(true)}>Rapporteer</button>
                </>}
                {!user && <p style={{ fontSize: 13, color: '#888' }}>Log in om contact op te nemen.</p>}{user && user.id === selectedAd.seller_id && (
  <button style={btnR} onClick={() => deleteAd(selectedAd.id)}>Verwijder advertentie</button>
)}{user && user.id === selectedAd.seller_id && (
  <button style={btnR} onClick={() => deleteAd(selectedAd.id)}>Verwijder advertentie</button>
{user && user.id === selectedAd.seller_id && (
  <button style={btnR} onClick={() => deleteAd(selectedAd.id)}>Verwijder advertentie</button>
)}
)}
              </div>
              {showReview && (
                <div style={{ marginTop: 16, padding: 16, background: '#f9f9f9', borderRadius: 8 }}>
                  <p style={{ margin: '0 0 8px', fontWeight: 600 }}>Review schrijven</p>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    {[1,2,3,4,5].map(n => <button key={n} onClick={() => setNewReview(p => ({ ...p, rating: n }))} style={{ ...btn, background: newReview.rating >= n ? '#ef9f27' : '#fff', color: newReview.rating >= n ? '#fff' : '#1a1a1a', padding: '4px 10px' }}>★</button>)}
                  </div>
                  <textarea style={{ ...inp, height: 80, marginBottom: 8 }} placeholder="Jouw ervaring..." value={newReview.comment} onChange={e => setNewReview(p => ({ ...p, comment: e.target.value }))} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={btnP} onClick={submitReview}>Plaatsen</button>
                    <button style={btn} onClick={() => setShowReview(false)}>Annuleren</button>
                  </div>
                </div>
              )}
              {showReport && (
                <div style={{ marginTop: 16, padding: 16, background: '#fff5f5', borderRadius: 8 }}>
                  <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#a32d2d' }}>Rapporteer advertentie</p>
                  <select style={{ ...inp, marginBottom: 8 }} value={reportReason} onChange={e => setReportReason(e.target.value)}>
                    <option value="">Kies een reden...</option>
                    {REPORT_REASONS.map(r => <option key={r}>{r}</option>)}
                  </select>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={btnR} onClick={submitReport}>Rapporteer</button>
                    <button style={btn} onClick={() => setShowReport(false)}>Annuleren</button>
                  </div>
                </div>
              )}
              {reviews.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <p style={{ fontWeight: 600, marginBottom: 12 }}>Reviews</p>
                  {reviews.map(r => (
                    <div key={r.id} style={{ padding: 12, background: '#f9f9f9', borderRadius: 8, marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong style={{ fontSize: 14 }}>{r.reviewer_name}</strong>
                        <span style={{ color: '#ef9f27' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: 13 }}>{r.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>}

        {/* AUTH */}
        {page === 'auth' && <>
          <div style={{ maxWidth: 380, margin: '0 auto', background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 28 }}>
            {verifyEmailSent ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 40 }}>📧</p>
                <h3>Bevestig je e-mail</h3>
                <p style={{ color: '#555', fontSize: 14 }}>Verificatielink gestuurd naar <strong>{regForm.email}</strong></p>
                <button style={btnP} onClick={() => { setVerifyEmailSent(false); setAuthMode('login') }}>Naar inloggen</button>
              </div>
            ) : <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                <button style={{ ...btn, flex: 1, background: authMode === 'login' ? '#185fa5' : '#fff', color: authMode === 'login' ? '#fff' : '#1a1a1a' }} onClick={() => setAuthMode('login')}>Inloggen</button>
                <button style={{ ...btn, flex: 1, background: authMode === 'register' ? '#185fa5' : '#fff', color: authMode === 'register' ? '#fff' : '#1a1a1a' }} onClick={() => setAuthMode('register')}>Registreren</button>
              </div>
              {authMode === 'login' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input style={inp} placeholder="E-mail" value={loginForm.email} onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))} />
                  <input style={inp} type="password" placeholder="Wachtwoord" value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))} />
                  {authErr && <p style={{ color: '#e24b4a', fontSize: 13 }}>{authErr}</p>}
                  <button style={btnP} onClick={login}>Inloggen</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input style={inp} placeholder="Naam" value={regForm.name} onChange={e => setRegForm(p => ({ ...p, name: e.target.value }))} />
                  <input style={inp} placeholder="E-mail" value={regForm.email} onChange={e => setRegForm(p => ({ ...p, email: e.target.value }))} />
                  <input style={inp} placeholder="Telefoonnummer" value={regForm.phone} onChange={e => setRegForm(p => ({ ...p, phone: e.target.value }))} />
                  <input style={inp} type="password" placeholder="Wachtwoord (min. 6 tekens)" value={regForm.password} onChange={e => setRegForm(p => ({ ...p, password: e.target.value }))} />
                  {authErr && <p style={{ color: '#e24b4a', fontSize: 13 }}>{authErr}</p>}
                  <button style={btnP} onClick={register}>Account aanmaken</button>
                  <p style={{ fontSize: 12, color: '#888' }}>Je ontvangt een verificatie e-mail na registratie.</p>
                </div>
              )}
            </>}
          </div>
        </>}

        {/* PROFILE */}
        {page === 'profile' && user && <>
          <h2 style={{ fontWeight: 600, marginBottom: 16 }}>Mijn Profiel</h2>
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 24, maxWidth: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#e6f1fb', color: '#185fa5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 24 }}>{profile?.name?.[0] || '?'}</div>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 18 }}>{profile?.name}</p>
                <p style={{ margin: '2px 0', fontSize: 13, color: '#888' }}>{user.email}</p>
                {profile?.phone && <p style={{ margin: '2px 0', fontSize: 13, color: '#888' }}>📱 {profile.phone}</p>}
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  {user.email_confirmed_at && <span style={{ background: '#eaf3de', color: '#3b6d11', fontSize: 11, padding: '2px 8px', borderRadius: 12 }}>✓ E-mail</span>}
                  {idStatusBadge()}
                </div>
              </div>
            </div>

            {/* ID Verificatie sectie */}
            {profile?.id_status !== 'goedgekeurd' && (
              <div style={{ border: '1px solid #eee', borderRadius: 12, padding: 20, marginBottom: 20 }}>
                <h3 style={{ margin: '0 0 8px', fontWeight: 600, fontSize: 16 }}>🔐 Identiteitsverificatie</h3>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: '#555' }}>
                  Verifieer je identiteit om advertenties te kunnen plaatsen. Je moet 3 foto's uploaden.
                </p>

                {profile?.id_status === 'ingediend' && (
                  <div style={{ background: '#faeeda', color: '#854f0b', padding: 12, borderRadius: 8, fontSize: 13 }}>
                    ⏳ Je verificatie is ingediend en wordt nagekeken door de admin. Dit kan 1-2 werkdagen duren.
                  </div>
                )}

                {profile?.id_status === 'afgewezen' && (
                  <div style={{ background: '#fff5f5', color: '#a32d2d', padding: 12, borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
                    ✗ Je verificatie is afgekeurd. Dien nieuwe foto's in.
                  </div>
                )}

                {(profile?.id_status === 'niet_ingediend' || profile?.id_status === 'afgewezen') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Stap 1 */}
                    <div style={{ padding: 16, background: '#f9f9f9', borderRadius: 8, border: '1px solid #eee' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#185fa5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>1</div>
                        <p style={{ margin: 0, fontWeight: 600 }}>Foto van EU ID-kaart of Paspoort</p>
                      </div>
                      <p style={{ margin: '0 0 8px', fontSize: 12, color: '#888' }}>Alleen Europese identiteitsdocumenten zijn toegestaan. Zorg dat alle gegevens duidelijk leesbaar zijn.</p>
                      <input type="file" accept="image/*" onChange={e => setIdStep1(e.target.files?.[0] || null)} />
                      {idStep1 && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#3b6d11' }}>✓ {idStep1.name}</p>}
                    </div>

                    {/* Stap 2 */}
                    <div style={{ padding: 16, background: '#f9f9f9', borderRadius: 8, border: '1px solid #eee' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#185fa5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>2</div>
                        <p style={{ margin: 0, fontWeight: 600 }}>Selfie foto van jezelf</p>
                      </div>
                      <p style={{ margin: '0 0 8px', fontSize: 12, color: '#888' }}>Maak een duidelijke selfie van je gezicht. Dit wordt vergeleken met je ID-foto om te bevestigen dat jij het bent.</p>
                      <input type="file" accept="image/*" onChange={e => setIdStep2(e.target.files?.[0] || null)} />
                      {idStep2 && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#3b6d11' }}>✓ {idStep2.name}</p>}
                    </div>

                    {/* Stap 3 */}
                    <div style={{ padding: 16, background: '#f9f9f9', borderRadius: 8, border: '1px solid #eee' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#185fa5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>3</div>
                        <p style={{ margin: 0, fontWeight: 600 }}>Foto met recente krant of Belgische/Nederlandse bon</p>
                      </div>
                      <p style={{ margin: '0 0 8px', fontSize: 12, color: '#888' }}>Houd een recente krant of kassabon van een Belgische of Nederlandse winkel vast. Dit bevestigt dat je je in België of Nederland bevindt.</p>
                      <input type="file" accept="image/*" onChange={e => setIdStep3(e.target.files?.[0] || null)} />
                      {idStep3 && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#3b6d11' }}>✓ {idStep3.name}</p>}
                    </div>

                    {idError && <div style={{ background: '#fff5f5', color: '#a32d2d', padding: 12, borderRadius: 8, fontSize: 13 }}>{idError}</div>}

                    <button style={{ ...btnP, opacity: (!idStep1 || !idStep2 || !idStep3) ? 0.5 : 1 }} onClick={submitIdVerification} disabled={idUploading || !idStep1 || !idStep2 || !idStep3}>
                      {idUploading ? 'Uploading...' : 'Verificatie indienen'}
                    </button>

                    {idSuccess && <div style={{ background: '#eaf3de', color: '#3b6d11', padding: 12, borderRadius: 8, fontSize: 13 }}>✓ Verificatie succesvol ingediend! De admin bekijkt je documenten.</div>}
                  </div>
                )}
              </div>
            )}

            {profile?.id_status === 'goedgekeurd' && (
              <div style={{ background: '#eaf3de', color: '#3b6d11', padding: 16, borderRadius: 8, marginBottom: 20, fontSize: 13 }}>
                ✓ Je identiteit is geverifieerd. Je kan advertenties plaatsen!
              </div>
            )}

            {/* Favorieten */}
            <div>
              <p style={{ fontWeight: 600, marginBottom: 12 }}>Mijn favorieten ({favorites.length})</p>
              {favorites.length === 0 && <p style={{ color: '#888', fontSize: 13 }}>Nog geen favorieten. Klik op ❤️ bij een advertentie!</p>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {ads.filter(a => favorites.includes(a.id)).map(ad => (
                  <div key={ad.id} onClick={() => { setSelectedAd(ad); fetchReviews(ad.seller_id); setPage('detail') }} style={{ background: '#f9f9f9', border: '1px solid #eee', borderRadius: 8, padding: 10, cursor: 'pointer' }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>{ad.title}</p>
                    <p style={{ margin: '2px 0 0', color: '#185fa5', fontSize: 13 }}>€{ad.price}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>}

        {/* PLACE AD */}
        {page === 'place' && <>
          <h2 style={{ fontWeight: 600, marginBottom: 16 }}>Advertentie plaatsen</h2>
          {adSuccess ? (
            <div style={{ background: '#eaf3de', color: '#3b6d11', padding: 16, borderRadius: 8 }}>Advertentie ingediend! Wacht op goedkeuring.</div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 24, maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {profile?.id_status !== 'goedgekeurd' && (
                <div style={{ background: '#fff5f5', color: '#a32d2d', padding: 12, borderRadius: 8, fontSize: 13 }}>
                  ⚠️ Je moet eerst je identiteit verifiëren voor je een advertentie kan plaatsen.
                  <button style={{ ...btnP, marginLeft: 8, fontSize: 12, padding: '4px 10px' }} onClick={() => setPage('profile')}>Verifieer nu</button>
                </div>
              )}
              {adWarning && <div style={{ background: '#fff5f5', color: '#a32d2d', padding: 12, borderRadius: 8, fontSize: 13 }}>{adWarning}</div>}
              <input style={inp} placeholder="Titel*" value={newAd.title} onChange={e => setNewAd(p => ({ ...p, title: e.target.value }))} />
              <input style={inp} type="number" placeholder="Prijs (€)*" value={newAd.price} onChange={e => setNewAd(p => ({ ...p, price: e.target.value }))} />
              <select style={inp} value={newAd.category} onChange={e => setNewAd(p => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.filter(c => c !== 'Alle').map(c => <option key={c}>{c}</option>)}
              </select>
              <input style={inp} placeholder="Locatie*" value={newAd.location} onChange={e => setNewAd(p => ({ ...p, location: e.target.value }))} />
              <textarea style={{ ...inp, height: 80, resize: 'vertical' }} placeholder="Beschrijving" value={newAd.description} onChange={e => setNewAd(p => ({ ...p, description: e.target.value }))} />
              <div>
                <p style={{ fontSize: 13, color: '#888', margin: '0 0 6px' }}>Foto uploaden:</p>
                <input type="file" accept="image/*" onChange={e => setImgFile(e.target.files?.[0] || null)} />
              </div>
              <button style={{ ...btnP, opacity: profile?.id_status !== 'goedgekeurd' ? 0.5 : 1 }} onClick={submitAd} disabled={imgUploading || profile?.id_status !== 'goedgekeurd'}>
                {imgUploading ? 'Uploading...' : 'Indienen'}
              </button>
            </div>
          )}
        </>}

        {/* MESSAGES */}
        {page === 'messages' && user && <>
          <h2 style={{ fontWeight: 600, marginBottom: 16 }}>Berichten</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>
            <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, overflow: 'hidden' }}>
              {activeChat ? (
                <div style={{ padding: '12px 16px', background: '#e6f1fb' }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>{activeChat.title}</p>
                </div>
              ) : <p style={{ padding: 12, fontSize: 13, color: '#888' }}>Geen chats.</p>}
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

        {/* ADMIN */}
        {page === 'admin' && profile?.role === 'admin' && <>
          <h2 style={{ fontWeight: 600, marginBottom: 16 }}>Admin Dashboard</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            {[{ label: 'Advertenties', value: ads.length }, { label: 'In wachtrij', value: pendingAds.length }, { label: 'ID verificaties', value: pendingIds.length }, { label: 'Rapporten', value: reports.length }].map(s => (
              <div key={s.label} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#185fa5' }}>{s.value}</p>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* ID Verificaties */}
          {pendingIds.length > 0 && <>
            <h3 style={{ fontWeight: 600 }}>🔐 ID Verificaties ({pendingIds.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              {pendingIds.map(u => (
                <div key={u.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600 }}>{u.name}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 13, color: '#888' }}>{u.phone}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={btnG} onClick={() => approveId(u.id)}>Goedkeuren</button>
                      <button style={btnR} onClick={() => rejectId(u.id)}>Afwijzen</button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div>
                      <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 600, color: '#555' }}>1. EU ID / Paspoort</p>
                      <img src={u.id_step1} alt="ID" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid #eee' }} />
                    </div>
                    <div>
                      <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 600, color: '#555' }}>2. Selfie</p>
                      <img src={u.id_step2} alt="Selfie" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid #eee' }} />
                    </div>
                    <div>
                      <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 600, color: '#555' }}>3. Krant / Bon</p>
                      <img src={u.id_step3} alt="Bewijs" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid #eee' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>}

          {/* Advertenties wachtrij */}
          <h3 style={{ fontWeight: 600 }}>Advertenties in wachtrij ({pendingAds.length})</h3>
          {pendingAds.length === 0 && <p style={{ color: '#888' }}>Geen advertenties in wachtrij.</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {pendingAds.map(ad => (
              <div key={ad.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <img src={ad.img} alt={ad.title} style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 8 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>{ad.title}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 13, color: '#888' }}>€{ad.price} · {ad.category} · {ad.location} · {ad.seller_name}</p>
                    <p style={{ margin: '4px 0 0', fontSize: 13 }}>{ad.description}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button style={btnG} onClick={() => approveAd(ad.id)}>Goedkeuren</button>
                    <button style={btnR} onClick={() => rejectAd(ad.id)}>Afwijzen</button>
                    <button style={{ ...btn, fontSize: 12 }} onClick={() => checkAdWithAI(ad)}>AI Check</button>
                  </div>
                </div>
                {aiLoading && <p style={{ margin: '8px 0 0', fontSize: 13, color: '#888' }}>AI controleert...</p>}
                {aiCheck && (
                  <div style={{ marginTop: 12, padding: 12, background: '#f0f7ff', borderRadius: 8, fontSize: 13 }}>
                    <strong>AI Beoordeling:</strong>
                    <p style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{aiCheck}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Rapporten */}
          <h3 style={{ fontWeight: 600 }}>Rapporten ({reports.length})</h3>
          {reports.length === 0 && <p style={{ color: '#888' }}>Geen rapporten.</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {reports.map(r => (
              <div key={r.id} style={{ background: '#fff5f5', border: '1px solid #f09595', borderRadius: 8, padding: 12, fontSize: 13 }}>
                <strong>Advertentie #{r.ad_id}</strong> — {r.reason}
              </div>
            ))}
          </div>

          {/* Gebruikers */}
          <h3 style={{ fontWeight: 600 }}>Gebruikers ({users.length})</h3>
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, overflow: 'hidden' }}>
            {users.map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid #eee' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e6f1fb', color: '#185fa5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 13 }}>{u.name?.[0] || '?'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{u.name}</p>
                    {u.id_status === 'goedgekeurd' && <span style={{ background: '#eaf3de', color: '#3b6d11', fontSize: 10, padding: '1px 6px', borderRadius: 10 }}>✓ ID</span>}
                    {u.id_status === 'ingediend' && <span style={{ background: '#faeeda', color: '#854f0b', fontSize: 10, padding: '1px 6px', borderRadius: 10 }}>⏳ In behandeling</span>}
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: '#888' }}>{u.role} {u.phone && `· ${u.phone}`}</p>
                </div>
                {u.role !== 'admin' && (
                  <button style={{ ...btn, fontSize: 12 }} onClick={async () => { await supabase.from('profiles').update({ role: 'admin' }).eq('id', u.id); fetchUsers() }}>Maak admin</button>
                )}
              </div>
            ))}
          </div>
        </>}

      </div>
    </div>
  )
}