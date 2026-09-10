import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  // Sadece yetkili kullanıcıların görebileceği sayfalar.
  // /api, /_next, statik dosyalar ve login/register gibi açık olması gereken sayfalar dışındaki her yeri yakalar.
  matcher: [
    "/admin/:path*",
    "/profile/:path*",
  ],
};
