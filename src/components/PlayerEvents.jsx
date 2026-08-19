import { useEffect, useState } from 'react'
import { getMyRegistrations } from '../services/innov8Api'

export default function PlayerEvents() {
  const[events,setEvents]=useState([])
  const[loading,setLoading]=useState(true)
  useEffect(()=>{let active=true;getMyRegistrations().then(result=>{if(active)setEvents(result||[])}).catch(()=>{}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[])
  return <span className="player-events"><small>REGISTERED EVENTS</small><b>{loading?'LOADING PLAYER EVENTS...':events.length?events.map(event=>event.name).join(' / '):'NO EVENTS REGISTERED'}</b></span>
}

