import styles from "@/app/main.module.css";

export function PrimaryLink(props:{
    href:string,
    text:string,
    style?:React.CSSProperties
}){
    return (
        <a className={styles.primaryButton} style={props.style} href={props.href}>
            {props.text}
        </a>
    )
}