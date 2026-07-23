import um5_logo from "../assets/um5.png"

export default function Login() {
    return (
        <div className="flex ">
            <section className="left-panel bg-[#003087] text-white h-screen flex flex-col gap-3 justify-between p-20 w-1/3 ">
                <div className=" bg-gray-500 w-fit rounded "><img src={um5_logo} alt="logo um5" className="bg-white w-30 h-20 m-5 rounded"  /></div>
                
                <span className="border-t w-10 border-gray-400"></span>
                <h1 className="text-4xl">Gestion des Conventions de Partenariat</h1>
                <h2 className=" opacity-70  ">Accédez à votre espace de suivi, d'archivage et de pilotage des conventions de partenariat de l'UM5.</h2>
                <span className=" opacity-40 ">© 2026 Université Mohammed V de Rabat</span>
            </section>
            <section className="right-panel h-screen p-20 flex flex-col justify-around bg-[#f5f3ef] w-2/3 m-auto">
                <h1 className="text-4xl font-bold">Connexion</h1>
                <form action="POST" className=" text-[#6b7280]">
                    <div className=" flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <label className="font-mono  ">Email institutionnel</label>
                            <input type = "email" placeholder="prenom.nom@um5.ac.ma" className="bg-white p-3"/>
                        </div>
                        <div className="flex flex-col gap-2">
                           <div className="flex justify-between">
                             <label className="font-mono " >Mot de passe  </label>
                             <a href="#" className="underline ">Mot de passe oublié ?</a>
                            </div>
                            <input type = "password" placeholder=""className="bg-white p-3" />
                        </div>
                    <button type="submit " className="bg-[#C5CFE8] w-full text-left p-3"> Se connecter</button>                        
                    </div>
                    <br />
                    
                </form>
                <div className="text-center">Accès non autorisé ? <a href="#" className="text-blue-800 text-xl underline">Contacter l'administrateur</a></div>
            </section>
        </div>
    )
}