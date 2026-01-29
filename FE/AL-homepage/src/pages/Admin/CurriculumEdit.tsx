import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCurriculumById, updateCurriculum } from '../../api/curriculum.api'
import PageHeader from '../../components/page/PageHeader'
import Loading from '../../components/ui/Loading'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import type { Curriculum } from '../../types/curriculum'

const CurriculumEdit = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCurriculum = async () => {
      if (!id) {
        setError('Curriculum ID is not provided.')
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const data = await getCurriculumById(Number(id))
        setCurriculum(data)
        setName(data.curriculum_name)
      } catch (err) {
        setError('Failed to fetch curriculum details.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchCurriculum()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    try {
      await updateCurriculum(Number(id), name)
      navigate(`/admin/curriculums/${id}`)
    } catch (err) {
      setError('Failed to update curriculum.')
      console.error(err)
    }
  }

  if (loading) {
    return <Loading />
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  if (!curriculum) {
    return <div>No curriculum data found.</div>
  }

  return (
    <div>
      <PageHeader title="Edit Curriculum" />
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Edit {curriculum.curriculum_name}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="name" className="font-semibold">
                    Curriculum Name
                  </label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-4 flex space-x-2">
                <Button type="submit">Save Changes</Button>
                <Button onClick={() => navigate(-1)} variant="outline">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default CurriculumEdit
