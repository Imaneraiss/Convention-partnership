import { useState } from "react"
import um5_logo from "../assets/um5.png"
import { Eye , EyeOff, MoveRight} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"

export default function Login() {

    const [showPassword, setShowPassword] = useState(false)
    const [ email , setEmail] = useState("")
    const [ password , setPassword] = useState("")
    const isFormValid =  email.trim() !== "" && password.trim() !== ""

    const { login } = useAuth()
    const navigate = useNavigate()
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)


    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const data = await login(email, password)
            
            // Redirection selon le rôle
            if (data.premiere_connexion) {
                navigate('/change-password')
            } else if (data.role === 'SG') {
                navigate('/budget')
            } else {
                navigate('/dashboard')
            }
        } catch (err) {
            setError("Email ou mot de passe incorrect")
            console.log(error)
        } finally {
            setLoading(false)
        }
    }
    return (
        <div className="flex bg-[#f5f3ef]">
            <section className="left-panel bg-[#003087] text-white h-screen flex flex-col gap-3 justify-between p-20 w-1/3 ">
                <div className=" bg-[#154399] w-fit"><img src={um5_logo} alt="Logo de l'Université Mohammed V" className="bg-white w-30 h-20 m-5  "  /></div>
                
                <span className="border-t w-10 border-gray-400"></span>
                <h1 className="text-4xl">Gestion des Conventions de Partenariat</h1>
                <h2 className=" opacity-70  ">Accédez à votre espace de suivi, d'archivage et de pilotage des conventions de partenariat de l'UM5.</h2>
                <span className=" opacity-40 ">© 2026 Université Mohammed V de Rabat</span>
            </section>

            <section className="right-panel h-screen p-20 flex flex-col justify-around w-auto m-auto">
                <h1 className="text-4xl font-bold">Connexion</h1>
                <form onSubmit={handleSubmit} className=" text-[#6b7280]">
                    <div className=" flex flex-col gap-5 ">
                        <div className="flex flex-col gap-2  ">
                            <label htmlFor="email" className="font-mono  ">Email institutionnel</label>
                            <input id="email" type = "email" 
                                   value={email}
                                   onChange={(e)=>setEmail(e.target.value)}
                                   placeholder="prenom.nom@um5.ac.ma" 
                                   className="bg-white p-3   "/>
                        </div>

                        <div className="flex flex-col gap-2">
                           <div className="flex justify-between">
                             <label htmlFor="password" className="font-mono " >Mot de passe  </label>
                             <a href="#" className="underline ">Mot de passe oublié ?</a>
                            </div>
                            <div className="flex bg-white p-3 relative ">
                                <input id="password"  type ={showPassword ? "text" :"password" } 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="outline-none w-4/5"/>

                                <button type = "button" 
                                        className="absolute right-3"
                                        onClick={() => setShowPassword(!showPassword)} > 
                                        {showPassword ? <EyeOff/> : <Eye/> }
                                </button>
                            </div>
                        </div>
                        <button type="submit" 
                                className={`flex justify-between w-full text-left p-3 mt-10  ${
                            isFormValid ?  "bg-[#0c3e9c] text-white cursor-pointer" : "bg-[#C5CFE8] "
                                 }`}
                                 disabled ={!isFormValid}> 
                            <span>Se connecter</span>
                            <MoveRight/>
                        </button>                        
                    </div>
                    <br />
                    
                </form>
                <div className="text-center">Accès non autorisé ? <a href="#" className="text-blue-800 text-xl underline">Contacter l'administrateur</a></div>
            </section>
        </div>
    )
}