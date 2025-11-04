import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { cloudinaryUpload } from '../config/cloudinary';

class AuthController {
  public async changeProfileImg(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw { code: 400, message: "No file uploaded" };
      }
      const upload = await cloudinaryUpload(req.file);

      // Contoh: Update gambar profil untuk user dengan id 1
      // Dalam aplikasi nyata, Anda akan mendapatkan id user dari token otentikasi
      const userId = 1; 
      await prisma.accounts.update({
        where: { id: userId },
        data: { profile_img: upload.secure_url },
      });

      res.status(200).send({
        success: true,
        message: "Change image profile success",
        imageUrl: upload.secure_url
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;