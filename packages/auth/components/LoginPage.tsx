import { LoginForm } from '../components/LoginForm'

export function LoginPage() {
  return (
    <div className="h-screen w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-8 px-4">
          <div className="grid gap-2 text-center">
            <h1 className="text-2xl font-bold">Sign in to Play Money</h1>
          </div>

          <LoginForm />
        </div>
      </div>
      <div className="hidden bg-primary lg:block"></div>
    </div>
  )
}
