export default function Login() {
    return (
        <>
            <section className="left-panel">
                <img src="../assets/um5.png" alt="logo um5" />
                <h1>Gestion des Conventions de Partenariat</h1>
                <h2>Accédez à votre espace de suivi, d'archivage et de pilotage des conventions de partenariat de l'UM5.</h2>
                <span>© 2026 Université Mohammed V de Rabat</span>
            </section>
            <section className="right-panel">
                <h1>Connexion</h1>
                <form action="POST">
                    <div>
                        <label>Email institutionnel</label>
                        <input type = "email" placeholder="prenom.nom@um5.ac.ma"/>
                    </div>
                    <div>
                        <label >Mot de passe</label>
                        <input type = "password" placeholder="" />
                    </div>
                </form>
            </section>
        </>
    )
}