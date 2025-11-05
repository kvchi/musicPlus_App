import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HeadphonesIcon } from 'lucide-react'

export default function Header() {
    
  return (
    <div className='flex justify-between items-center px-10 py-10'>
        <div className='flex items-center gap-3'>
            <h1>MusicPluz</h1>
        <HeadphonesIcon />
        </div>
        <div className='flex items-center gap-4'>
            <Link to="/sign-in" className=' bg-pink-500 p-2 rounded-md' >Sign In</Link>
            <Link to="/sign-up" className='bg-pink-500 p-2 rounded-md' >Sign Up</Link>
        </div>
    </div>
  )
}
