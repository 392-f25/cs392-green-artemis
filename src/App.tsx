import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'

const App = () => {
  const [count, setCount] = useState(0)

  return (
    <div className="text-center">
      <header className="bg-[#282c34] min-h-screen flex flex-col items-center justify-center text-[calc(10px_+_2vmin)] text-white">
        <img src={reactLogo} className="h-[20vmin] pointer-events-none motion-safe:animate-logo-spin" alt="logo" />
        <img src={viteLogo} className="h-[20vmin] pointer-events-none motion-safe:animate-logo-spin" alt="logo" />
        <p className="m-4">Hello React + Vite!</p>
        <p> 
          <button className="bg-blue-400 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded " onClick={() => setCount(count => count + 1)}>
            count is: {count}
          </button>
        </p>
        <p className="italic text-gray-400">
          Edit <code>App.tsx</code> to test hot module replacement (HMR).
        </p>
        <p className='mt-4'>
          <a className="bg-cyan-300 hover:bg-cyan-400 text-black font-bold py-2 px-4 rounded"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
          {' | '}
          <a className='bg-cyan-300 hover:bg-cyan-400 text-black font-bold py-2 px-4 rounded'
            href="https://vitejs.dev/guide/features.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Vite Docs
          </a>
        </p>
      </header>
    </div>
  )
}

export default App
