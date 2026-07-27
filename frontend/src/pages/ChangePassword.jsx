import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import authService from "../services/authService"

export default function ChangePassword() {
    const { user } = useAuth()
    const navigate = useNavigate()

    const [ancienMotDePasse, setAncienMotDePasse] = useState('')
    const [nouveauMotDePasse, setNouveauMotDePasse] = useState('')
    const [confirmMotDePasse, setConfirmMotDePasse] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (nouveauMotDePasse !== confirmMotDePasse) {
            setError("Les mots de passe ne correspondent pas")
            return
        }

        setLoading(true)
        try {
            await authService.changePassword(ancienMotDePasse, nouveauMotDePasse)
            navigate('/dashboard')
        } catch (err) {
            setError("Ancien mot de passe incorrect")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <h1>Changer le mot de passe</h1>
            <span>Première connexion — changement obligatoire</span>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            <form onSubmit={handleSubmit}>
                <input
                    type="password"
                    placeholder="Ancien mot de passe"
                    value={ancienMotDePasse}
                    onChange={(e) => setAncienMotDePasse(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Nouveau mot de passe"
                    value={nouveauMotDePasse}
                    onChange={(e) => setNouveauMotDePasse(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Confirmer mot de passe"
                    value={confirmMotDePasse}
                    onChange={(e) => setConfirmMotDePasse(e.target.value)}
                />

                <button type="submit" disabled={loading}>
                    {loading ? "Enregistrement..." : "Enregistrer"}
                </button>
            </form>
        </div>
    )
}