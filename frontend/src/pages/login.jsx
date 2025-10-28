import AuthButtons from "../components/AuthButtons";

export default function Login() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="p-8 bg-white shadow-lg rounded-2xl max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Sign In to AsaliTrace
        </h1>
        <AuthButtons />
      </div>
    </div>
  );
}