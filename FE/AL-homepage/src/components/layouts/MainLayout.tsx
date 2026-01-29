// src/components/layouts/MainLayout.tsx
import { Outlet } from 'react-router-dom'
import SideNav from './SideNav'
import PageHeader from '../page/PageHeader'
import { PageHeaderProvider, usePageHeader } from '../../contexts/PageHeaderContext'

function MainContent() {
  const { title, description, actions, entityName } = usePageHeader()

  return (
    <main className="flex-1 flex flex-col ml-64 overflow-x-hidden">
      <div className="sticky top-0 bg-white z-20">
        <PageHeader title={title} description={description} actions={actions} entityName={entityName} />
      </div>
      <div className="flex-1 overflow-auto bg-gray-50 py-6">
        <div className="container-main max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <Outlet />
          </div>
        </div>
      </div>
    </main>
  )
}

export default function MainLayout() {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 flex-shrink-0 fixed left-0 top-0 h-full bg-white shadow-lg z-30">
        <div className="h-full overflow-y-auto">
          <SideNav />
        </div>
      </aside>
      <PageHeaderProvider>
        <MainContent />
      </PageHeaderProvider>
    </div>
  )
}
