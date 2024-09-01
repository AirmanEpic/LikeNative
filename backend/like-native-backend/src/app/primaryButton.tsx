import styles from "@/app/main.module.css";

export function PrimaryButton(props:{
    onClick:()=>void,
    text:string,
    style?:React.CSSProperties
}){
    return (
        <button onClick={props.onClick} className={styles.primaryButton} style={props.style}>
            {props.text}
        </button>
    )
}